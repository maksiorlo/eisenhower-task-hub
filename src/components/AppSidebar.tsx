
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { ArchiveView } from './ArchiveView';
import { ThemeToggle } from './ThemeToggle';
import { ExportData } from './ExportData';
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
import { Plus, Trash2, Archive, Settings } from 'lucide-react';

export function AppSidebar() {
  const { state, actions } = useApp();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

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

  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (taskId && taskId !== draggedTask) {
      await actions.moveTaskToProject(taskId, projectId);
    }
    
    setDraggedTask(null);
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
                      className="flex items-center justify-between w-full group"
                      onDragOver={(e) => handleDragOver(e, project.id)}
                      onDrop={(e) => handleDrop(e, project.id)}
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
                        onClick={() => actions.deleteProject(project.id)}
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
                  <SidebarMenuButton onClick={() => setShowArchive(true)}>
                    <Archive className="h-4 w-4" />
                    <span>Архив</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-4">
          <div className="space-y-2">
            <ExportData />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Settings className="h-3 w-3" />
              <span>Горячие клавиши: 1-4 (квадранты), / (поиск), ← → (проекты)</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      {showArchive && (
        <ArchiveView onClose={() => setShowArchive(false)} />
      )}
    </>
  );
}
