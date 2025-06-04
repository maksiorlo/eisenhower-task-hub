
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { StorageService } from '../services/StorageService';
import { Task, Project } from '../services/StorageService';
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

export function ArchiveView({ onClose }: ArchiveViewProps) {
  const { actions } = useApp();
  const { toast } = useToast();
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedItems();
  }, []);

  const loadArchivedItems = async () => {
    try {
      const tasks = await StorageService.getArchivedTasks();
      const projects = await StorageService.getArchivedProjects();
      setArchivedTasks(tasks);
      setArchivedProjects(projects);
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

  const handleRestoreProject = async (project: Project) => {
    try {
      await StorageService.restoreProject(project.id);
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

  const handleRestoreTask = async (task: Task) => {
    try {
      await StorageService.restoreTask(task.id);
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
        await StorageService.permanentDeleteTask(id);
      } else {
        await StorageService.permanentDeleteProject(id);
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

  const getQuadrantName = (quadrant: number) => {
    switch (quadrant) {
      case 1: return 'Важное и срочное';
      case 2: return 'Важное, не срочное';
      case 3: return 'Не важное, срочное';
      case 4: return 'Не важное, не срочное';
      default: return 'Неопределено';
    }
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
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreTask(task)}
                        >
                          <RotateCcw className="h-4 w-4" />
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
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreProject(project)}
                        >
                          <RotateCcw className="h-4 w-4" />
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
