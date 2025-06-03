
import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';

export function useKeyboardShortcuts() {
  const { state, actions } = useApp();
  const { actions: undoActions } = useUndo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo (Cmd+Z / Ctrl+Z)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        
        // Try to restore deleted project first, then task
        const lastDeletedProject = undoActions.getLastDeletedProject();
        if (lastDeletedProject) {
          actions.createProject(lastDeletedProject.project.name);
          lastDeletedProject.tasks.forEach(task => actions.createTask({
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            completed: task.completed,
            quadrant: task.quadrant,
            projectId: lastDeletedProject.project.id,
          }));
          undoActions.clearDeletedProject(lastDeletedProject.project.id);
          return;
        }
        
        const lastDeletedTask = undoActions.getLastDeletedTask();
        if (lastDeletedTask) {
          actions.createTask({
            title: lastDeletedTask.title,
            description: lastDeletedTask.description,
            deadline: lastDeletedTask.deadline,
            completed: lastDeletedTask.completed,
            quadrant: lastDeletedTask.quadrant,
            projectId: lastDeletedTask.projectId,
          });
          undoActions.clearDeletedTask(lastDeletedTask.id);
        }
        return;
      }

      // New task (Cmd+N / Ctrl+N)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        const createInput = document.querySelector('.create-task-input') as HTMLInputElement;
        if (createInput) {
          createInput.focus();
        }
        return;
      }

      // Search focus (/)
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Поиск"]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      // Project navigation (←/→)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const currentIndex = state.projects.findIndex(p => p.id === state.currentProject?.id);
        if (currentIndex !== -1) {
          const nextIndex = e.key === 'ArrowRight' 
            ? (currentIndex + 1) % state.projects.length
            : (currentIndex - 1 + state.projects.length) % state.projects.length;
          const nextProject = state.projects[nextIndex];
          if (nextProject) {
            actions.selectProject(nextProject);
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.projects, state.currentProject, actions, undoActions]);
}
