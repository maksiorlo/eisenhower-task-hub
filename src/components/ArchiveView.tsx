
import React, { useState, useEffect } from 'react';
import { Task, Project, storageService } from '../services/StorageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArchiveViewProps {
  onClose: () => void;
}

export function ArchiveView({ onClose }: ArchiveViewProps) {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadArchivedData = async () => {
      try {
        const [tasks, projects] = await Promise.all([
          storageService.getArchivedTasks(),
          storageService.getArchivedProjects()
        ]);
        setArchivedTasks(tasks);
        setArchivedProjects(projects);
      } catch (error) {
        console.error('Error loading archived data:', error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить архивные данные",
          variant: "destructive",
        });
      }
    };

    loadArchivedData();
  }, [toast]);

  const filteredTasks = archivedTasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = archivedProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestoreProject = async (id: string) => {
    try {
      await storageService.restoreProject(id);
      setArchivedProjects(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Проект восстановлен",
        description: "Проект успешно восстановлен из архива",
      });
    } catch (error) {
      console.error('Error restoring project:', error);
      toast({
        title: "Ошибка восстановления",
        description: "Не удалось восстановить проект",
        variant: "destructive",
      });
    }
  };

  const handleRestoreTask = async (id: string) => {
    try {
      await storageService.restoreTask(id);
      setArchivedTasks(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Задача восстановлена",
        description: "Задача успешно восстановлена из архива",
      });
    } catch (error) {
      console.error('Error restoring task:', error);
      toast({
        title: "Ошибка восстановления",
        description: "Не удалось восстановить задачу",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await storageService.deleteProject(id);
      setArchivedProjects(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Проект удален",
        description: "Проект окончательно удален",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить проект",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await storageService.deleteTask(id);
      setArchivedTasks(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Задача удалена",
        description: "Задача окончательно удалена",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить задачу",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col border">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Архив</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="p-4">
          <Input
            placeholder="Поиск в архиве..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-6">
          {filteredProjects.length > 0 && (
            <div>
              <h3 className="text-md font-medium mb-3">Архивированные проекты</h3>
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{project.name}</span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRestoreProject(project.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Восстановить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length > 0 && (
            <div>
              <h3 className="text-md font-medium mb-3">Архивированные задачи</h3>
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRestoreTask(task.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Восстановить
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredTasks.length === 0 && filteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Архив пуст</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
