import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Task, Project, storageService } from '../services/StorageService';
import { useToast } from '@/hooks/use-toast';

interface AppState {
  projects: Project[];
  tasks: Task[];
  currentProject: Project | null;
  searchQuery: string;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string };

const initialState: AppState = {
  projects: [],
  tasks: [],
  currentProject: null,
  searchQuery: '',
  isLoading: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id ? action.payload : p
        ),
        currentProject: state.currentProject?.id === action.payload.id 
          ? action.payload 
          : state.currentProject
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload 
          ? null 
          : state.currentProject
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload)
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  actions: {
    loadProjects: () => Promise<void>;
    loadTasks: () => Promise<void>;
    createProject: (name: string) => Promise<void>;
    updateProject: (project: Project) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    archiveProject: (id: string) => Promise<void>;
    selectProject: (project: Project) => void;
    createTask: (taskData: Partial<Task>) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    searchTasks: (query: string) => void;
    moveTaskToProject: (taskId: string, projectId: string) => Promise<void>;
    createRecurringTask: (task: Task) => Promise<void>;
    reorderProjects: (projectIds: string[]) => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { toast } = useToast();

  const actions = {
    loadProjects: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const projects = await storageService.getAllProjects();
        dispatch({ type: 'SET_PROJECTS', payload: projects });
        
        // Автоматически выбираем первый проект, если нет текущего
        if (!state.currentProject && projects.length > 0) {
          dispatch({ type: 'SET_CURRENT_PROJECT', payload: projects[0] });
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить проекты',
          variant: 'destructive'
        });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    loadTasks: async () => {
      if (!state.currentProject) return;
      
      try {
        const tasks = await storageService.getTasksByProject(state.currentProject.id);
        dispatch({ type: 'SET_TASKS', payload: tasks });
      } catch (error) {
        console.error('Failed to load tasks:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить задачи',
          variant: 'destructive'
        });
      }
    },

    createProject: async (name: string) => {
      try {
        const project: Project = {
          id: crypto.randomUUID(),
          name,
          createdAt: new Date().toISOString(),
          order: state.projects.length,
        };
        
        await storageService.saveProject(project);
        dispatch({ type: 'ADD_PROJECT', payload: project });
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
        
        toast({
          title: 'Проект создан',
          description: `Проект "${name}" успешно создан`,
          duration: 10000,
        });
      } catch (error) {
        console.error('Failed to create project:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось создать проект',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    updateProject: async (project: Project) => {
      try {
        await storageService.saveProject(project);
        dispatch({ type: 'UPDATE_PROJECT', payload: project });
      } catch (error) {
        console.error('Failed to update project:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось обновить проект',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    deleteProject: async (id: string) => {
      try {
        await storageService.deleteProject(id);
        dispatch({ type: 'DELETE_PROJECT', payload: id });
        
        toast({
          title: 'Проект удален',
          description: 'Проект и все связанные задачи удалены',
          duration: 10000,
        });
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить проект',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    archiveProject: async (id: string) => {
      try {
        await storageService.archiveProject(id);
        dispatch({ type: 'DELETE_PROJECT', payload: id });
        
        toast({
          title: 'Проект архивирован',
          description: 'Проект перемещен в архив',
          duration: 10000,
        });
      } catch (error) {
        console.error('Failed to archive project:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось архивировать проект',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    selectProject: (project: Project) => {
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
    },

    createTask: async (taskData: Partial<Task>) => {
      if (!state.currentProject) return;
      
      try {
        const task: Task = {
          id: crypto.randomUUID(),
          title: taskData.title || '',
          description: taskData.description,
          completed: false,
          createdAt: new Date().toISOString(),
          deadline: taskData.deadline,
          deadlineTime: taskData.deadlineTime,
          quadrant: taskData.quadrant || 'not-urgent-not-important',
          projectId: state.currentProject.id,
          order: state.tasks.length,
          isRecurring: taskData.isRecurring,
          recurrencePattern: taskData.recurrencePattern,
        };
        
        await storageService.saveTask(task);
        dispatch({ type: 'ADD_TASK', payload: task });
      } catch (error) {
        console.error('Failed to create task:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось создать задачу',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    updateTask: async (task: Task) => {
      try {
        await storageService.saveTask(task);
        dispatch({ type: 'UPDATE_TASK', payload: task });
        
        // Если задача архивирована, убрать её из текущего списка
        if (task.archived) {
          dispatch({ type: 'DELETE_TASK', payload: task.id });
        }
      } catch (error) {
        console.error('Failed to update task:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось обновить задачу',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    deleteTask: async (id: string) => {
      try {
        await storageService.deleteTask(id);
        dispatch({ type: 'DELETE_TASK', payload: id });
      } catch (error) {
        console.error('Failed to delete task:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить задачу',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    searchTasks: (query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    },

    moveTaskToProject: async (taskId: string, projectId: string) => {
      try {
        const task = await storageService.getTask(taskId);
        if (task) {
          const updatedTask = { ...task, projectId };
          await storageService.saveTask(updatedTask);
          
          // Удаляем задачу из текущего списка
          dispatch({ type: 'DELETE_TASK', payload: taskId });
          
          toast({
            title: 'Задача перемещена',
            description: 'Задача успешно перемещена в другой проект',
            duration: 10000,
          });
        }
      } catch (error) {
        console.error('Failed to move task:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось переместить задачу',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    createRecurringTask: async (task: Task) => {
      try {
        const newTask = await storageService.createRecurringTask(task);
        dispatch({ type: 'ADD_TASK', payload: newTask });
        
        toast({
          title: 'Повторяющаяся задача создана',
          description: 'Новая задача создана согласно расписанию',
          duration: 10000,
        });
      } catch (error) {
        console.error('Failed to create recurring task:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось создать повторяющуюся задачу',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },

    reorderProjects: async (projectIds: string[]) => {
      try {
        for (let i = 0; i < projectIds.length; i++) {
          await storageService.updateProjectOrder(projectIds[i], i);
        }
        await actions.loadProjects();
      } catch (error) {
        console.error('Failed to reorder projects:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось изменить порядок проектов',
          variant: 'destructive',
          duration: 10000,
        });
      }
    },
  };

  useEffect(() => {
    actions.loadProjects();
  }, []);

  useEffect(() => {
    if (state.currentProject) {
      actions.loadTasks();
    }
  }, [state.currentProject]);

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
