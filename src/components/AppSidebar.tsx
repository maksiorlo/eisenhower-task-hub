
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import { Project, storageService } from '../services/StorageService';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProjectContextMenu } from './ProjectContextMenu';
import { ArchiveView } from './ArchiveView';
import { ThemeToggle } from './ThemeToggle';
import { Plus, Archive } from 'lucide-react';

export function AppSidebar() {
  const { state, actions } = useApp();
  const { actions: undoActions } = useUndo();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);
  const [dragOverFromTask, setDragOverFromTask] = useState(false);

  // Handle drag over for projects (from tasks)
  useEffect(() => {
    const handleTaskDragOver = (e: DragEvent) => {
      const taskId = e.dataTransfer?.getData('text/plain');
      if (taskId) {
        setDragOverFromTask(true);
      }
    };

    const handleTaskDragLeave = () => {
      setDragOverFromTask(false);
      setDragOverProject(null);
    };

    const handleTaskDrop = () => {
      setDragOverFromTask(false);
      setDragOverProject(null);
    };

    document.addEventListener('dragover', handleTaskDragOver);
    document.addEventListener('dragleave', handleTaskDragLeave);
    document.addEventListener('drop', handleTaskDrop);

    return () => {
      document.removeEventListener('dragover', handleTaskDragOver);
      document.removeEventListener('dragleave', handleTaskDragLeave);
      document.removeEventListener('drop', handleTaskDrop);
    };
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    await actions.createProject(newProjectName.trim());
    setNewProjectName('');
    setIsCreateDialogOpen(false);
  };

  const handleProjectDoubleClick = (project: Project) => {
    setIsEditingProject(project.id);
    setEditingName(project.name);
  };

  const handleProjectNameUpdate = async (projectId: string) => {
    if (editingName.trim() && editingName !== state.projects.find(p => p.id === projectId)?.name) {
      const project = state.projects.find(p => p.id === projectId);
      if (project) {
        await actions.updateProject({
          ...project,
          name: editingName.trim(),
        });
      }
    }
    setIsEditingProject(null);
    setEditingName('');
  };

  const handleProjectDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/project', project.id);
  };

  const handleProjectDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    const dataType = Array.from(e.dataTransfer.types);
    
    if (dataType.includes('application/project')) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverProject(projectId);
    } else if (dataType.includes('text/plain')) {
      // Task being dragged
      e.dataTransfer.dropEffect = 'move';
      setDragOverProject(projectId);
    }
  };

  const handleProjectDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the project element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverProject(null);
    }
  };

  const handleProjectDrop = async (e: React.DragEvent, targetProject: Project) => {
    e.preventDefault();
    setDragOverProject(null);
    
    const dataType = Array.from(e.dataTransfer.types);
    
    if (dataType.includes('application/project') && draggedProject) {
      // Project reordering
      const fromIndex = state.projects.findIndex(p => p.id === draggedProject.id);
      const toIndex = state.projects.findIndex(p => p.id === targetProject.id);
      
      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        await actions.reorderProjects(fromIndex, toIndex);
      }
    } else if (dataType.includes('text/plain')) {
      // Task being moved to project
      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId && targetProject.id !== state.currentProject?.id) {
        await actions.moveTaskToProject(taskId, targetProject.id);
      }
    }
    
    setDraggedProject(null);
  };

  const handleProjectDragEnd = () => {
    setDraggedProject(null);
    setDragOverProject(null);
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Проекты</h2>
            <div className="flex gap-1">
              <ThemeToggle />
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Создать проект</DialogTitle>
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
                      <Button type="submit">Создать</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2">
          <SidebarMenu>
            {state.projects.map((project) => (
              <SidebarMenuItem key={project.id}>
                <ProjectContextMenu project={project}>
                  <div
                    className={`w-full transition-colors ${
                      dragOverProject === project.id ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400 ring-opacity-50 rounded' : ''
                    }`}
                    draggable={!isEditingProject}
                    onDragStart={(e) => handleProjectDragStart(e, project)}
                    onDragOver={(e) => handleProjectDragOver(e, project.id)}
                    onDragLeave={handleProjectDragLeave}
                    onDrop={(e) => handleProjectDrop(e, project)}
                    onDragEnd={handleProjectDragEnd}
                  >
                    {isEditingProject === project.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleProjectNameUpdate(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleProjectNameUpdate(project.id);
                          } else if (e.key === 'Escape') {
                            setIsEditingProject(null);
                            setEditingName('');
                          }
                        }}
                        autoFocus
                        className="h-auto p-2 text-sm"
                      />
                    ) : (
                      <SidebarMenuButton
                        isActive={state.currentProject?.id === project.id}
                        onClick={() => actions.selectProject(project)}
                        onDoubleClick={() => handleProjectDoubleClick(project)}
                        className="w-full justify-start"
                      >
                        <span className="truncate">{project.name}</span>
                      </SidebarMenuButton>
                    )}
                  </div>
                </ProjectContextMenu>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsArchiveOpen(true)}
            className="w-full justify-start"
          >
            <Archive className="h-4 w-4 mr-2" />
            Архив
          </Button>
        </SidebarFooter>
      </Sidebar>

      {isArchiveOpen && (
        <ArchiveView onClose={() => setIsArchiveOpen(false)} />
      )}
    </>
  );
}
