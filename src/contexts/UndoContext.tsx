
import React, { createContext, useContext, useReducer } from 'react';
import { Task } from '../services/StorageService';

interface UndoState {
  deletedTasks: Array<{ task: Task; timestamp: number }>;
}

type UndoAction =
  | { type: 'ADD_DELETED_TASK'; payload: Task }
  | { type: 'CLEAR_DELETED_TASK'; payload: string }
  | { type: 'CLEAR_ALL' };

const initialState: UndoState = {
  deletedTasks: [],
};

function undoReducer(state: UndoState, action: UndoAction): UndoState {
  switch (action.type) {
    case 'ADD_DELETED_TASK':
      return {
        ...state,
        deletedTasks: [...state.deletedTasks, { task: action.payload, timestamp: Date.now() }]
          .slice(-10), // Keep only last 10 deleted tasks
      };
    case 'CLEAR_DELETED_TASK':
      return {
        ...state,
        deletedTasks: state.deletedTasks.filter(item => item.task.id !== action.payload),
      };
    case 'CLEAR_ALL':
      return initialState;
    default:
      return state;
  }
}

interface UndoContextType {
  state: UndoState;
  actions: {
    addDeletedTask: (task: Task) => void;
    clearDeletedTask: (taskId: string) => void;
    getLastDeletedTask: () => Task | null;
    clearAll: () => void;
  };
}

const UndoContext = createContext<UndoContextType | null>(null);

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(undoReducer, initialState);

  const actions = {
    addDeletedTask: (task: Task) => {
      dispatch({ type: 'ADD_DELETED_TASK', payload: task });
    },
    clearDeletedTask: (taskId: string) => {
      dispatch({ type: 'CLEAR_DELETED_TASK', payload: taskId });
    },
    getLastDeletedTask: (): Task | null => {
      const lastDeleted = state.deletedTasks[state.deletedTasks.length - 1];
      return lastDeleted ? lastDeleted.task : null;
    },
    clearAll: () => {
      dispatch({ type: 'CLEAR_ALL' });
    },
  };

  return (
    <UndoContext.Provider value={{ state, actions }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within UndoProvider');
  }
  return context;
}
