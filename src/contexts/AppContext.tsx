
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Task, Project, storageService } from '../services/StorageService';

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  isLoading: boolean;
  searchQuery: string;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string };

const initialState: AppState = {
  projects: [],
  currentProject: null,
  tasks: [],
  isLoading: true,
  searchQuery: '',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p),
        currentProject: state.currentProject?.id === action.payload.id ? action.payload : state.currentProject,
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject,
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadProjects: () => Promise<void>;
    createProject: (name: string) => Promise<void>;
    selectProject: (project: Project) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    loadTasks: (projectId: string) => Promise<void>;
    searchTasks: (query: string) => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    loadProjects: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const projects = await storageService.getAllProjects();
        dispatch({ type: 'SET_PROJECTS', payload: projects });
        
        // Select the first project if available
        if (projects.length > 0 && !state.currentProject) {
          await actions.selectProject(projects[0]);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },

    createProject: async (name: string) => {
      const project: Project = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
      };
      
      await storageService.saveProject(project);
      dispatch({ type: 'ADD_PROJECT', payload: project });
      
      // Auto-select the new project
      await actions.selectProject(project);
    },

    selectProject: async (project: Project) => {
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
      await actions.loadTasks(project.id);
    },

    deleteProject: async (id: string) => {
      await storageService.deleteProject(id);
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    },

    createTask: async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
      const task: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      
      await storageService.saveTask(task);
      dispatch({ type: 'ADD_TASK', payload: task });
    },

    updateTask: async (task: Task) => {
      await storageService.saveTask(task);
      dispatch({ type: 'UPDATE_TASK', payload: task });
    },

    deleteTask: async (id: string) => {
      await storageService.deleteTask(id);
      dispatch({ type: 'DELETE_TASK', payload: id });
    },

    loadTasks: async (projectId: string) => {
      const tasks = await storageService.getTasksByProject(projectId);
      dispatch({ type: 'SET_TASKS', payload: tasks });
    },

    searchTasks: async (query: string) => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
      if (query.trim()) {
        const tasks = await storageService.searchTasks(query, state.currentProject?.id);
        dispatch({ type: 'SET_TASKS', payload: tasks });
      } else if (state.currentProject) {
        await actions.loadTasks(state.currentProject.id);
      }
    },
  };

  useEffect(() => {
    actions.loadProjects();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
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
