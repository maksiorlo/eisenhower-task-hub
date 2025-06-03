
import React, { useState, useEffect } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  defaultQuadrant?: Task['quadrant'];
}

export function TaskModal({ task, isOpen, onClose, defaultQuadrant }: TaskModalProps) {
  const { state, actions } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [quadrant, setQuadrant] = useState<Task['quadrant']>('urgent-important');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDeadline(task.deadline || '');
      setQuadrant(task.quadrant);
    } else {
      setTitle('');
      setDescription('');
      setDeadline('');
      setQuadrant(defaultQuadrant || 'urgent-important');
    }
  }, [task, defaultQuadrant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !state.currentProject) return;

    if (task) {
      // Update existing task
      await actions.updateTask({
        ...task,
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        quadrant,
      });
    } else {
      // Create new task
      await actions.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        quadrant,
        projectId: state.currentProject.id,
        completed: false,
      });
    }

    onClose();
  };

  const quadrantOptions = [
    { value: 'urgent-important', label: 'Срочно и важно' },
    { value: 'important-not-urgent', label: 'Важно, не срочно' },
    { value: 'urgent-not-important', label: 'Срочно, не важно' },
    { value: 'not-urgent-not-important', label: 'Не срочно и не важно' },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              placeholder="Название задачи"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Дополнительная информация (опционально)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="deadline">Дедлайн</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="quadrant">Квадрант</Label>
            <Select value={quadrant} onValueChange={(value: Task['quadrant']) => setQuadrant(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quadrantOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {task ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
