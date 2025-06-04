
import React, { useState } from 'react';
import { Project } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Archive, Edit } from 'lucide-react';

interface ProjectContextMenuProps {
  project: Project;
  children: React.ReactNode;
}

export function ProjectContextMenu({ project, children }: ProjectContextMenuProps) {
  const { state, actions } = useApp();
  const { actions: undoActions } = useUndo();
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState(project.name);

  const handleDelete = async () => {
    if (confirm('Удалить проект и все его задачи?')) {
      const projectTasks = state.tasks.filter(t => t.projectId === project.id);
      undoActions.addDeletedProject(project, projectTasks);
      await actions.deleteProject(project.id);
    }
  };

  const handleArchive = async () => {
    await actions.archiveProject(project.id);
  };

  const handleRename = async () => {
    if (newName.trim() && newName.trim() !== project.name) {
      await actions.updateProject({
        ...project,
        name: newName.trim(),
      });
    }
    setIsRenameModalOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(project.name);
      setIsRenameModalOpen(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => setIsRenameModalOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Переименовать
          </ContextMenuItem>
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

      <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Переименовать проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Название проекта"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewName(project.name);
                  setIsRenameModalOpen(false);
                }}
              >
                Отмена
              </Button>
              <Button 
                onClick={handleRename}
                disabled={!newName.trim() || newName.trim() === project.name}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
