
import React from 'react';
import { Task, Project } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Trash2, Archive, ArrowRight } from 'lucide-react';

interface TaskContextMenuProps {
  task: Task;
  children: React.ReactNode;
}

export function TaskContextMenu({ task, children }: TaskContextMenuProps) {
  const { state, actions } = useApp();
  const { actions: undoActions } = useUndo();

  const handleDelete = async () => {
    undoActions.addDeletedTask(task);
    await actions.deleteTask(task.id);
  };

  const handleArchive = async () => {
    await actions.updateTask({ ...task, archived: true });
  };

  const handleMoveToProject = async (projectId: string) => {
    await actions.moveTaskToProject(task.id, projectId);
  };

  const otherProjects = state.projects.filter(p => p.id !== task.projectId);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить
        </ContextMenuItem>
        <ContextMenuItem onClick={handleArchive}>
          <Archive className="h-4 w-4 mr-2" />
          Архивировать
        </ContextMenuItem>
        {otherProjects.length > 0 && (
          <>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <ArrowRight className="h-4 w-4 mr-2" />
                Перенести в проект
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {otherProjects.map((project) => (
                  <ContextMenuItem
                    key={project.id}
                    onClick={() => handleMoveToProject(project.id)}
                  >
                    {project.name}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
