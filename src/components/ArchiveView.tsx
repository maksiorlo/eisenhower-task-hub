
import React, { useState, useEffect } from 'react';
import { Task, Project, storageService } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export function ArchiveView() {
  const { actions } = useApp();
  const { toast } = useToast();
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchivedData();
  }, []);

  const loadArchivedData = async () => {
    try {
      const [tasks, projects] = await Promise.all([
        storageService.getArchivedTasks(),
        storageService.getArchivedProjects()
      ]);
      setArchivedTasks(tasks);
      setArchivedProjects(projects);
    } catch (error) {
      console.error('Failed to load archived data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить архивные данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await storageService.restoreProject(projectId);
      await actions.loadProjects();
      await loadArchivedData();
      toast({
        title: 'Проект восстановлен',
        description: 'Проект успешно перемещен из архива'
      });
    } catch (error) {
      console.error('Failed to restore project:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось восстановить проект',
        variant: 'destructive'
      });
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    try {
      await storageService.restoreTask(taskId);
      await actions.loadTasks();
      await loadArchivedData();
      toast({
        title: 'Задача восстановлена',
        description: 'Задача успешно перемещена из архива'
      });
    } catch (error) {
      console.error('Failed to restore task:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось восстановить задачу',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Окончательно удалить проект? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await storageService.deleteProject(projectId);
      await loadArchivedData();
      toast({
        title: 'Проект удален',
        description: 'Проект окончательно удален'
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить проект',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Окончательно удалить задачу? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await storageService.deleteTask(taskId);
      await loadArchivedData();
      toast({
        title: 'Задача удалена',
        description: 'Задача окончательно удалена'
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить задачу',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка архива...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Архив</h1>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Задачи ({archivedTasks.length})</TabsTrigger>
          <TabsTrigger value="projects">Проекты ({archivedProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-3">
          {archivedTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Нет архивных задач</p>
            </div>
          ) : (
            archivedTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Архивировано: {format(new Date(task.createdAt), 'd MMM yyyy', { locale: ru })}</span>
                        {task.deadline && (
                          <span>Срок: {format(new Date(task.deadline), 'd MMM yyyy', { locale: ru })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreTask(task.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-3">
          {archivedProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Нет архивных проектов</p>
            </div>
          ) : (
            archivedProjects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-gray-600">
                        Создан: {format(new Date(project.createdAt), 'd MMM yyyy', { locale: ru })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreProject(project.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
