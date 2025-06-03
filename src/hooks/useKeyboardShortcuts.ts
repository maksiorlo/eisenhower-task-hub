
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

      // Quadrant navigation (1/2/3/4)
      if (['1', '2', '3', '4'].includes(e.key)) {
        const quadrantMap = {
          '1': 'urgent-important',
          '2': 'important-not-urgent', 
          '3': 'urgent-not-important',
          '4': 'not-urgent-not-important'
        };
        const quadrant = quadrantMap[e.key as keyof typeof quadrantMap];
        const quadrantElement = document.querySelector(`[data-quadrant="${quadrant}"]`);
        quadrantElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Create task (N)
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        // Focus on first available create input or create one in urgent-important
        const createInput = document.querySelector('.create-task-input') as HTMLInputElement;
        if (createInput) {
          createInput.focus();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.projects, state.currentProject, actions, undoActions]);
}
