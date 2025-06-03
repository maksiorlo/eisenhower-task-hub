
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FolderOpen, Archive, Trash2 } from 'lucide-react';
import { ArchiveView } from './ArchiveView';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state, actions } = useApp();
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showArchive, setShowArchive] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    await actions.createProject(newProjectName.trim());
    setNewProjectName('');
    setIsCreatingProject(false);
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить проект и все его задачи?')) {
      await actions.deleteProject(projectId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && state.currentProject?.id !== projectId) {
      await actions.moveTaskToProject(taskId, projectId);
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <h2 className="text-lg font-semibold">Матрица Эйзенхауэра</h2>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              Проекты
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingProject(true)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              {isCreatingProject && (
                <form onSubmit={handleCreateProject} className="p-2">
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Название проекта"
                    autoFocus
                    onBlur={() => {
                      if (!newProjectName.trim()) {
                        setIsCreatingProject(false);
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </form>
              )}
              
              <SidebarMenu>
                {state.projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton
                      isActive={state.currentProject?.id === project.id}
                      onClick={() => actions.selectProject(project)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, project.id)}
                      className="group justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        <span className="truncate">{project.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter className="p-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowArchive(true)}
          >
            <Archive className="h-4 w-4 mr-2" />
            Архив
          </Button>
        </SidebarFooter>
      </Sidebar>

      {showArchive && (
        <ArchiveView onClose={() => setShowArchive(false)} />
      )}
    </>
  );
}
