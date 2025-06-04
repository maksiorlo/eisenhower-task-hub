
import React from 'react';
import { Project } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Trash2, Archive, Edit } from 'lucide-react';

interface ProjectContextMenuProps {
  project: Project;
  children: React.ReactNode;
}

export function ProjectContextMenu({ project, children }: ProjectContextMenuProps) {
  const { state, actions } = useApp();
  const { actions: undoActions } = useUndo();

  const handleDelete = async () => {
    const projectTasks = state.tasks.filter(t => t.projectId === project.id);
    undoActions.addDeletedProject(project, projectTasks);
    await actions.deleteProject(project.id);
  };

  const handleArchive = async () => {
    await actions.archiveProject(project.id);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={handleArchive}>
          <Archive className="h-4 w-4 mr-2" />
          Архивировать
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Удалить
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
