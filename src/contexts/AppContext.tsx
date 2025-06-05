import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Task, Project, storageService } from '../services/StorageService';
import { useToast } from '@/hooks/use-toast';

interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';
  interval?: number;
  daysOfWeek?: number[];
}

interface AppState {
  tasks: Task[];
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  searchQuery: string;
}

interface AppActions {
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createProject: (name: string) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  selectProject: (project: Project) => void;
  loadData: () => Promise<void>;
  loadProjects: () => Promise<void>;
  loadTasks: () => Promise<void>;
  searchTasks: (query: string) => void;
  moveTaskToProject: (taskId: string, projectId: string) => Promise<void>;
  moveTaskToArchive: (taskId: string) => Promise<void>;
  createRecurringTask: (originalTask: Task) => Promise<void>;
}

interface AppContextType {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | null>(null);

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SELECT_PROJECT'; payload: Project | null }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'SET_SEARCH_QUERY'; payload: string };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SELECT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
      };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? action.payload : project
        ),
        currentProject: state.currentProject?.id === action.payload.id ? action.payload : state.currentProject,
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    tasks: [],
    projects: [],
    currentProject: null,
    loading: true,
    searchQuery: '',
  });

  const { toast } = useToast();

  const loadData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [projects, tasks] = await Promise.all([
        storageService.getAllProjects(),
        storageService.getTasksByProject(''),
      ]);
      
      dispatch({ type: 'SET_PROJECTS', payload: projects });
      
      if (projects.length > 0 && !state.currentProject) {
        dispatch({ type: 'SELECT_PROJECT', payload: projects[0] });
        const projectTasks = await storageService.getTasksByProject(projects[0].id);
        dispatch({ type: 'SET_TASKS', payload: projectTasks });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные",
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadProjects = async () => {
    try {
      const projects = await storageService.getAllProjects();
      dispatch({ type: 'SET_PROJECTS', payload: projects });
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTasks = async () => {
    if (state.currentProject) {
      try {
        const tasks = await storageService.getTasksByProject(state.currentProject.id);
        dispatch({ type: 'SET_TASKS', payload: tasks });
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    }
  };

  const searchTasks = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const archiveTask = async (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, archived: true };
      await storageService.updateTask(updatedTask);
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    }
  };

  const reorderProjects = async (fromIndex: number, toIndex: number) => {
    const newProjects = [...state.projects];
    const [movedProject] = newProjects.splice(fromIndex, 1);
    newProjects.splice(toIndex, 0, movedProject);
    
    // Update order for all projects
    for (let i = 0; i < newProjects.length; i++) {
      const updatedProject = { ...newProjects[i], order: i };
      await storageService.updateProject(updatedProject);
      newProjects[i] = updatedProject;
    }
    
    dispatch({ type: 'SET_PROJECTS', payload: newProjects });
  };

  const actions: AppActions = {
    createTask: async (taskData) => {
      const task: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      await storageService.saveTask(task);
      dispatch({ type: 'ADD_TASK', payload: task });
      
      toast({
        title: "Задача создана",
        description: `Задача "${task.title}" добавлена`,
        duration: 10000,
      });
    },

    updateTask: async (task) => {
      await storageService.saveTask(task);
      dispatch({ type: 'UPDATE_TASK', payload: task });
    },

    deleteTask: async (id) => {
      await storageService.deleteTask(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
    },

    createProject: async (name) => {
      const project: Project = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
      };
      await storageService.saveProject(project);
      dispatch({ type: 'ADD_PROJECT', payload: project });
    },

    updateProject: async (project) => {
      await storageService.saveProject(project);
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
    },

    deleteProject: async (id) => {
      await storageService.deleteProject(id);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    },

    archiveProject: async (id) => {
      await storageService.archiveProject(id);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    },

    selectProject: async (project) => {
      dispatch({ type: 'SELECT_PROJECT', payload: project });
      const tasks = await storageService.getTasksByProject(project.id);
      dispatch({ type: 'SET_TASKS', payload: tasks });
    },

    loadData,
    loadProjects,
    loadTasks,
    searchTasks,

    moveTaskToProject: async (taskId, projectId) => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        const updatedTask = { ...task, projectId };
        await storageService.saveTask(updatedTask);
        
        // Remove task from current project's task list
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        
        toast({
          title: "Задача перемещена",
          description: "Задача успешно перемещена в другой проект",
          duration: 10000,
        });
      }
    },

    moveTaskToArchive: async (taskId) => {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        const updatedTask = { ...task, archived: true };
        await storageService.saveTask(updatedTask);
        
        // Remove task from current view
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        
        toast({
          title: "Задача архивирована",
          description: "Задача перемещена в архив",
          duration: 10000,
        });
      }
    },

    createRecurringTask: async (originalTask) => {
      if (!originalTask.recurrencePattern) return;
      
      const nextDate = new Date();
      const pattern = originalTask.recurrencePattern;
      
      switch (pattern.type) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + (pattern.interval || 1));
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'weekdays':
          nextDate.setDate(nextDate.getDate() + 1);
          while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
          break;
        case 'weekends':
          nextDate.setDate(nextDate.getDate() + 1);
          while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6) {
            nextDate.setDate(nextDate.getDate() + 1);
          }
          break;
        case 'custom':
          if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
            nextDate.setDate(nextDate.getDate() + 1);
            while (!pattern.daysOfWeek.includes(nextDate.getDay())) {
              nextDate.setDate(nextDate.getDate() + 1);
            }
          }
          break;
      }
      
      const newTask = await storageService.createRecurringTask({
        ...originalTask,
        deadline: nextDate.toISOString().split('T')[0],
      });
      
      dispatch({ type: 'ADD_TASK', payload: newTask });
    },
  };

  const value = {
    state,
    actions: {
      ...actions,
      archiveTask,
      reorderProjects,
    },
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppContext.Provider value={value}>
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
