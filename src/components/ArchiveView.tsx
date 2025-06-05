
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { storageService, Task, Project } from '../services/StorageService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArchiveViewProps {
  onClose: () => void;
}

interface ArchivedItem {
  id: string;
  archivedAt: string;
  [key: string]: any;
}

export function ArchiveView({ onClose }: ArchiveViewProps) {
  const { actions } = useApp();
  const { toast } = useToast();
  const [archivedTasks, setArchivedTasks] = useState<(Task & ArchivedItem)[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<(Project & ArchivedItem & { taskCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedItems();
  }, []);

  const loadArchivedItems = async () => {
    try {
      const tasks = await storageService.getArchivedTasks();
      const projects = await storageService.getArchivedProjects();
      
      // Add task count to archived projects
      const projectsWithTaskCount = await Promise.all(
        projects.map(async (project) => {
          const projectTasks = await storageService.getArchivedTasksByProject(project.id);
          return {
            ...project,
            taskCount: projectTasks.length
          };
        })
      );
      
      setArchivedTasks(tasks);
      setArchivedProjects(projectsWithTaskCount);
    } catch (error) {
      console.error('Failed to load archived items:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить архив",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProject = async (project: Project & ArchivedItem) => {
    try {
      await storageService.restoreProject(project.id);
      await actions.loadProjects();
      await loadArchivedItems();
      toast({
        title: "Проект восстановлен",
        description: `Проект "${project.name}" восстановлен из архива`,
      });
    } catch (error) {
      console.error('Failed to restore project:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить проект",
        variant: "destructive",
      });
    }
  };

  const handleRestoreTask = async (task: Task & ArchivedItem) => {
    try {
      await storageService.restoreTask(task.id);
      await actions.loadTasks();
      await loadArchivedItems();
      toast({
        title: "Задача восстановлена",
        description: `Задача "${task.title}" восстановлена из архива`,
      });
    } catch (error) {
      console.error('Failed to restore task:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось восстановить задачу",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (type: 'task' | 'project', id: string) => {
    try {
      if (type === 'task') {
        await storageService.permanentDeleteTask(id);
      } else {
        await storageService.permanentDeleteProject(id);
      }
      await loadArchivedItems();
      toast({
        title: "Удалено навсегда",
        description: `${type === 'task' ? 'Задача' : 'Проект'} удален навсегда`,
      });
    } catch (error) {
      console.error('Failed to permanently delete:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить навсегда",
        variant: "destructive",
      });
    }
  };

  const getQuadrantName = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important': return 'Важное и срочное';
      case 'important-not-urgent': return 'Важное, не срочное';
      case 'urgent-not-important': return 'Не важное, срочное';
      case 'not-urgent-not-important': return 'Не важное, не срочное';
      default: return 'Неопределено';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Архив
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tasks" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">
              Задачи ({archivedTasks.length})
            </TabsTrigger>
            <TabsTrigger value="projects">
              Проекты ({archivedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="overflow-y-auto max-h-[60vh] space-y-4">
            {loading ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : archivedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет архивированных задач
              </div>
            ) : (
              archivedTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{task.title}</CardTitle>
                        {task.description && (
                          <CardDescription>{task.description}</CardDescription>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Архивировано: {formatDate(task.archivedAt)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreTask(task)}
                        >
                          Восстановить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePermanentDelete('task', task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {getQuadrantName(task.quadrant)}
                      </Badge>
                      {task.deadline && (
                        <Badge variant="outline">
                          {new Date(task.deadline).toLocaleDateString()}
                        </Badge>
                      )}
                      {task.completed && (
                        <Badge variant="default">Выполнено</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="projects" className="overflow-y-auto max-h-[60vh] space-y-4">
            {loading ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : archivedProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет архивированных проектов
              </div>
            ) : (
              archivedProjects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          Задач в проекте: {project.taskCount || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Архивирован: {formatDate(project.archivedAt)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreProject(project)}
                        >
                          Восстановить
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePermanentDelete('project', project.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
