
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

export function ProjectSelector() {
  const { state, actions } = useApp();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    await actions.createProject(newProjectName.trim());
    setNewProjectName('');
    setIsCreateDialogOpen(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Удалить проект и все его задачи?')) {
      await actions.deleteProject(projectId);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1">
        <Select
          value={state.currentProject?.id || ''}
          onValueChange={(value) => {
            const project = state.projects.find(p => p.id === value);
            if (project) actions.selectProject(project);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите проект" />
          </SelectTrigger>
          <SelectContent>
            {state.projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{project.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="ml-2 p-1 h-auto opacity-0 group-hover:opacity-100 hover:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Новый проект
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создать новый проект</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <Input
              placeholder="Название проекта"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={!newProjectName.trim()}>
                Создать
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
