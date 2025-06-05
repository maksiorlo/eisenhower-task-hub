
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TimeInput } from './TimeInput';
import { Calendar, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface EnhancedTaskInputProps {
  quadrant: Task['quadrant'];
  onCancel: () => void;
}

export function EnhancedTaskInput({ quadrant, onCancel }: EnhancedTaskInputProps) {
  const { state, actions } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const [deadlineTime, setDeadlineTime] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !state.currentProject) return;

    await actions.createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      deadlineTime: deadlineTime || undefined,
      quadrant,
      projectId: state.currentProject.id,
      completed: false,
    });

    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDeadline(date ? date.toISOString().split('T')[0] : '');
    setIsDatePickerOpen(false);
  };

  const isOverdue = deadline && new Date(deadline) < new Date();
  const deadlineClass = isOverdue ? 'text-red-500' : 'text-gray-500';

  return (
    <div className="p-3 bg-white border-2 border-blue-200 rounded-lg shadow-sm">
      <div className="space-y-3">
        <Textarea
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Название задачи"
          className="p-0 border-0 text-sm font-medium focus-visible:ring-0 resize-none min-h-[20px]"
          rows={1}
          style={{ 
            height: 'auto',
            minHeight: '20px'
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />
        
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Описание (опционально)"
          className="text-xs border-0 p-0 resize-none focus-visible:ring-0 min-h-[60px]"
          rows={3}
          style={{ 
            height: 'auto',
            minHeight: '60px'
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />
        
        <div className="flex items-center gap-2">
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-xs ${deadlineClass}`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {deadline 
                  ? format(new Date(deadline), 'd MMM yyyy', { locale: ru })
                  : 'Дата'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={deadline ? new Date(deadline) : undefined}
                onSelect={handleDateSelect}
                initialFocus
                className="p-3"
              />
            </PopoverContent>
          </Popover>

          {deadline && (
            <div className="flex items-center gap-1">
              <Clock className={`h-3 w-3 ${deadlineClass}`} />
              <TimeInput
                value={deadlineTime}
                onChange={setDeadlineTime}
                className={`h-6 w-20 text-xs px-2 border-0 bg-transparent focus:bg-white focus:border ${deadlineClass}`}
                placeholder="--:--"
              />
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
            Создать
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
}
