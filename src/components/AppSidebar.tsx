
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import { ArchiveView } from './ArchiveView';
import { ProjectContextMenu } from './ProjectContextMenu';
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
import { Plus, Archive, Settings } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function AppSidebar() {
  const { state, actions } = useApp();
  const { actions: undoActions } = useUndo();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);
  const [dragOverArchive, setDragOverArchive] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && selectedProject && !editingProject && !isCreating) {
        const project = state.projects.find(p => p.id === selectedProject);
        if (project) {
          setProjectToDelete(project);
          setShowDeleteDialog(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject, editingProject, isCreating, state.projects]);

  const handleDeleteProject = async () => {
    if (projectToDelete) {
      // Check if project has tasks
      const projectTasks = state.tasks.filter(task => task.projectId === projectToDelete.id);
      
      // Archive all tasks first
      for (const task of projectTasks) {
        await actions.updateTask({ ...task, archived: true });
      }
      
      // Then archive the project
      await actions.archiveProject(projectToDelete.id);
      
      toast({
        title: "Проект удален",
        description: `Проект "${projectToDelete.name}" перемещен в архив`,
        duration: 3000,
      });
    }
    setShowDeleteDialog(false);
    setProjectToDelete(null);
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      await actions.createProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
      
      toast({
        title: "Проект создан",
        description: `Проект "${newProjectName.trim()}" успешно создан`,
        duration: 10000,
      });
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

  const handleProjectDoubleClick = (project: any) => {
    setEditingProject(project.id);
    setEditingProjectName(project.name);
  };

  const handleRenameProject = async () => {
    const project = state.projects.find(p => p.id === editingProject);
    if (project && editingProjectName.trim() && editingProjectName.trim() !== project.name) {
      await actions.updateProject({
        ...project,
        name: editingProjectName.trim(),
      });
    }
    setEditingProject(null);
    setEditingProjectName('');
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameProject();
    } else if (e.key === 'Escape') {
      setEditingProject(null);
      setEditingProjectName('');
    }
  };

  // Task drag and drop handlers
  const handleTaskDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData('text/plain');
    // Check if it's a task (not a project)
    if (state.tasks.some(t => t.id === draggedData)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverProject(projectId);
    }
  };

  const handleTaskDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the project area
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverProject(null);
    }
  };

  const handleTaskDrop = async (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragOverProject(null);
    
    if (taskId && state.tasks.some(t => t.id === taskId)) {
      await actions.moveTaskToProject(taskId, projectId);
    }
  };

  // Project drag and drop handlers for reordering
  const handleProjectDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
  };

  const handleProjectDragEnd = () => {
    setDraggedProject(null);
    setDragOverArchive(false);
    setDragOverProject(null);
  };

  const handleProjectDragOver = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData('text/plain');
    
    // Handle project reordering
    if (draggedProject && draggedProject !== targetProjectId) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverProject(targetProjectId);
    }
    // Handle task drop
    else if (state.tasks.some(t => t.id === draggedData)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverProject(targetProjectId);
    }
  };

  const handleProjectDrop = async (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData('text/plain');
    setDragOverProject(null);
    
    // Handle project reordering
    if (draggedProject && draggedProject !== targetProjectId) {
      const draggedIndex = state.projects.findIndex(p => p.id === draggedProject);
      const targetIndex = state.projects.findIndex(p => p.id === targetProjectId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        await actions.reorderProjects(draggedIndex, targetIndex);
      }
    }
    // Handle task drop
    else if (state.tasks.some(t => t.id === draggedData)) {
      await actions.moveTaskToProject(draggedData, targetProjectId);
    }
  };

  // Archive drag and drop
  const handleArchiveDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData('text/plain');
    
    // Check if it's a project or task
    if (draggedProject || state.tasks.some(t => t.id === draggedData)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverArchive(true);
    }
  };

  const handleArchiveDragLeave = () => {
    setDragOverArchive(false);
  };

  const handleArchiveDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData('text/plain');
    setDragOverArchive(false);
    
    // Check if it's a project
    if (draggedProject && state.projects.some(p => p.id === draggedData)) {
      await actions.archiveProject(draggedData);
      
      toast({
        title: "Проект архивирован",
        description: "Проект перемещен в архив",
        duration: 10000,
      });
    }
    // Check if it's a task
    else if (state.tasks.some(t => t.id === draggedData)) {
      await actions.updateTask({ 
        ...state.tasks.find(t => t.id === draggedData)!, 
        archived: true 
      });
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
                    <ProjectContextMenu project={project}>
                      <div
                        className={`flex items-center justify-between w-full group cursor-move transition-colors ${
                          dragOverProject === project.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleProjectDragStart(e, project.id)}
                        onDragEnd={handleProjectDragEnd}
                        onDragOver={(e) => handleProjectDragOver(e, project.id)}
                        onDragLeave={handleTaskDragLeave}
                        onDrop={(e) => handleProjectDrop(e, project.id)}
                        onDoubleClick={() => handleProjectDoubleClick(project)}
                        onClick={() => setSelectedProject(project.id)}
                      >
                        {editingProject === project.id ? (
                          <Input
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            onKeyDown={handleRenameKeyPress}
                            onBlur={handleRenameProject}
                            className="h-8 text-sm"
                            autoFocus
                          />
                        ) : (
                          <SidebarMenuButton
                            isActive={state.currentProject?.id === project.id}
                            onClick={() => actions.selectProject(project)}
                            className="flex-1 min-w-0"
                          >
                            <span className="truncate text-left whitespace-normal break-words leading-tight">
                              {project.name}
                            </span>
                          </SidebarMenuButton>
                        )}
                      </div>
                    </ProjectContextMenu>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Проект "{projectToDelete?.name}" и все его задачи будут перемещены в архив. 
              Эта операция обратима.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отменить</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showArchive && (
        <ArchiveView onClose={() => setShowArchive(false)} />
      )}
    </>
  );
}
