
import React, { useState, useEffect } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TimeInput } from './TimeInput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Clock } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  const [deadlineTime, setDeadlineTime] = useState('');
  const [quadrant, setQuadrant] = useState<Task['quadrant']>('urgent-important');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Helper function to safely format dates
  const formatDeadlineDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T12:00:00');
      if (isValid(date)) {
        return format(date, 'd MMM yyyy', { locale: ru });
      }
      return 'Выберите дату';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Выберите дату';
    }
  };

  // Helper function to get initial calendar month safely
  const getInitialCalendarMonth = () => {
    if (deadline) {
      try {
        const date = new Date(deadline + 'T12:00:00');
        if (isValid(date)) {
          return date;
        }
      } catch (error) {
        console.error('Error parsing deadline for calendar:', error);
      }
    }
    return new Date();
  };

  // Helper function to get selected date for calendar safely
  const getSelectedDate = () => {
    if (deadline) {
      try {
        const date = new Date(deadline + 'T12:00:00');
        if (isValid(date)) {
          return date;
        }
      } catch (error) {
        console.error('Error parsing deadline for selection:', error);
      }
    }
    return undefined;
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setDeadline(task.deadline || '');
      setDeadlineTime(task.deadlineTime || '');
      setQuadrant(task.quadrant);
    } else {
      setTitle('');
      setDescription('');
      setDeadline('');
      setDeadlineTime('');
      setQuadrant(defaultQuadrant || 'urgent-important');
    }
  }, [task, defaultQuadrant, isOpen]);

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
        deadlineTime: deadlineTime || undefined,
        quadrant,
      });
    } else {
      // Create new task
      await actions.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        deadlineTime: deadlineTime || undefined,
        quadrant,
        projectId: state.currentProject.id,
        completed: false,
      });
    }

    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Create date string in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      setDeadline(dateString);
    } else {
      setDeadline('');
    }
    setIsDatePickerOpen(false);
  };

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeadline(e.target.value);
  };

  const quadrantOptions = [
    { value: 'urgent-important', label: 'Срочно и важно' },
    { value: 'important-not-urgent', label: 'Важно, не срочно' },
    { value: 'urgent-not-important', label: 'Срочно, не важно' },
    { value: 'not-urgent-not-important', label: 'Не срочно и не важно' },
  ] as const;

  // Calculate rows for description based on content or default
  const getDescriptionRows = () => {
    if (!description) return 8;
    const lines = description.split('\n').length;
    return Math.max(8, Math.min(lines + 2, 15));
  };

  const isOverdue = deadline && new Date(deadline + 'T23:59:59') < new Date();
  const deadlineClass = isOverdue ? 'text-red-500' : 'text-gray-500';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Заголовок *</Label>
            <Input
              id="title"
              placeholder="Название задачи"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
              className="text-base"
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Дополнительная информация (опционально)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={getDescriptionRows()}
              className="text-base resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="deadline">Дата</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    type="button"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {deadline 
                      ? formatDeadlineDate(deadline)
                      : 'Выберите дату'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" onDoubleClick={(e) => e.stopPropagation()}>
                  <div className="p-3">
                    <Input
                      type="date"
                      value={deadline}
                      onChange={handleManualDateChange}
                      className="mb-2"
                      dir="ltr"
                    />
                    <CalendarComponent
                      mode="single"
                      selected={getSelectedDate()}
                      onSelect={handleDateSelect}
                      defaultMonth={getInitialCalendarMonth()}
                      initialFocus
                      locale={ru}
                      weekStartsOn={1}
                      className="pointer-events-auto"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="deadlineTime">Время</Label>
              <div className="flex items-center gap-1">
                <Clock className={`h-3 w-3 ${deadlineClass}`} />
                <TimeInput
                  value={deadlineTime}
                  onChange={setDeadlineTime}
                  className="text-base h-10 flex-1"
                  placeholder="--:--"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="quadrant">Квадрант</Label>
              <Select value={quadrant} onValueChange={(value: Task['quadrant']) => setQuadrant(value)}>
                <SelectTrigger className="text-base">
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
          </div>

          <div className="flex justify-end gap-3 pt-6">
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
