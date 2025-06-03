
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import { ArchiveView } from './ArchiveView';
import { ThemeToggle } from './ThemeToggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Archive, Settings } from 'lucide-react';

export function AppSidebar() {
  const { state, actions } = useApp();
  const { actions: undoActions } = useUndo();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);
  const [dragOverArchive, setDragOverArchive] = useState(false);
  const { toast } = useToast();

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      await actions.createProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    } else if (e.key === 'Escape') {
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = state.projects.find(p => p.id === projectId);
    const projectTasks = state.tasks.filter(t => t.projectId === projectId);
    
    if (project) {
      undoActions.addDeletedProject(project, projectTasks);
      await actions.deleteProject(projectId);
      
      toast({
        title: "Проект удалён",
        description: "Нажмите Cmd+Z для отмены",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              actions.createProject(project.name);
              projectTasks.forEach(task => actions.createTask({
                title: task.title,
                description: task.description,
                deadline: task.deadline,
                completed: task.completed,
                quadrant: task.quadrant,
                projectId: project.id,
              }));
              undoActions.clearDeletedProject(project.id);
            }}
          >
            Отменить
          </Button>
        ),
      });
    }
  };

  // Task drag and drop handlers
  const handleTaskDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverProject(projectId);
  };

  const handleTaskDragLeave = () => {
    setDragOverProject(null);
  };

  const handleTaskDrop = async (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragOverProject(null);
    
    if (taskId) {
      await actions.moveTaskToProject(taskId, projectId);
    }
  };

  // Project drag and drop handlers
  const handleProjectDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
  };

  const handleProjectDragEnd = () => {
    setDraggedProject(null);
    setDragOverArchive(false);
  };

  const handleProjectDragOver = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    if (draggedProject && draggedProject !== targetProjectId) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleProjectDrop = async (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    const draggedProjectId = e.dataTransfer.getData('text/plain');
    
    if (draggedProjectId && draggedProjectId !== targetProjectId) {
      // Reorder projects logic would go here
      console.log('Reorder projects:', draggedProjectId, 'to', targetProjectId);
    }
  };

  // Archive drag and drop
  const handleArchiveDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedProject) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverArchive(true);
    }
  };

  const handleArchiveDragLeave = () => {
    setDragOverArchive(false);
  };

  const handleArchiveDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain');
    setDragOverArchive(false);
    
    if (projectId && draggedProject) {
      // Archive project logic
      await handleDeleteProject(projectId);
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task Matrix</h2>
            <ThemeToggle />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel>Проекты</SidebarGroupLabel>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(true)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <SidebarGroupContent>
              <SidebarMenu>
                {isCreating && (
                  <SidebarMenuItem>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={() => {
                        if (!newProjectName.trim()) {
                          setIsCreating(false);
                        }
                      }}
                      placeholder="Название проекта"
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </SidebarMenuItem>
                )}
                
                {state.projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <div
                      className={`flex items-center justify-between w-full group cursor-move transition-colors ${
                        dragOverProject === project.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleProjectDragStart(e, project.id)}
                      onDragEnd={handleProjectDragEnd}
                      onDragOver={(e) => {
                        handleTaskDragOver(e, project.id);
                        handleProjectDragOver(e, project.id);
                      }}
                      onDragLeave={handleTaskDragLeave}
                      onDrop={(e) => {
                        handleTaskDrop(e, project.id);
                        handleProjectDrop(e, project.id);
                      }}
                    >
                      <SidebarMenuButton
                        isActive={state.currentProject?.id === project.id}
                        onClick={() => actions.selectProject(project)}
                        className="flex-1"
                      >
                        <span className="truncate">{project.name}</span>
                      </SidebarMenuButton>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Инструменты</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => setShowArchive(true)}
                    className={`transition-colors ${
                      dragOverArchive ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onDragOver={handleArchiveDragOver}
                    onDragLeave={handleArchiveDragLeave}
                    onDrop={handleArchiveDrop}
                  >
                    <Archive className="h-4 w-4" />
                    <span>Архив</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Settings className="h-3 w-3" />
            <span>Горячие клавиши: ← → (проекты), ПКМ (меню задач)</span>
          </div>
        </SidebarFooter>
      </Sidebar>

      {showArchive && (
        <ArchiveView onClose={() => setShowArchive(false)} />
      )}
    </>
  );
}
