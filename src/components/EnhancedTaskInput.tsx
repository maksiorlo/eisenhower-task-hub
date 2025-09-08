
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TimeInput } from './TimeInput';
import { Calendar, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

// Helper function to safely format dates
const formatDeadlineDate = (dateString: string) => {
  try {
    const date = new Date(dateString + 'T12:00:00');
    if (isValid(date)) {
      return format(date, 'd MMM yyyy', { locale: ru });
    }
    return 'Дата';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Дата';
  }
};

interface EnhancedTaskInputProps {
  quadrant: Task['quadrant'];
  onCancel: () => void;
}

export function EnhancedTaskInput({ quadrant, onCancel }: EnhancedTaskInputProps) {
  const { actions, state } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<string | undefined>();
  const [deadlineTime, setDeadlineTime] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Handle click outside to cancel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (title.trim()) {
          handleSubmit();
        } else {
          onCancel();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title, description, deadline, deadlineTime]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    await actions.createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      quadrant,
      deadline,
      deadlineTime: deadlineTime || undefined,
      completed: false,
      projectId: state.currentProject?.id || '',
    });

    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Submit with Enter
        e.preventDefault();
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, setter: (value: string) => void) => {
    setter(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleDateSelect = (date: Date | undefined) => {
    setDeadline(date ? date.toISOString().split('T')[0] : undefined);
    setIsDatePickerOpen(false);
  };

  return (
    <div ref={containerRef} className="p-3 bg-white border-2 border-blue-200 rounded-lg shadow-sm space-y-2">
      <Textarea
        ref={titleRef}
        value={title}
        onChange={(e) => handleTextareaChange(e, setTitle)}
        onKeyDown={handleKeyDown}
        placeholder="Название задачи"
        className="p-0 border-0 text-sm font-medium resize-none min-h-[20px] focus-visible:ring-0 focus:outline-none"
        style={{ 
          height: 'auto',
          minHeight: '20px'
        }}
      />
      
      <Textarea
        ref={descriptionRef}
        value={description}
        onChange={(e) => handleTextareaChange(e, setDescription)}
        onKeyDown={handleKeyDown}
        placeholder="Описание задачи..."
        className="text-xs border-0 p-0 resize-none min-h-[16px] focus-visible:ring-0 focus:outline-none"
        style={{ 
          height: description ? 'auto' : '16px',
          minHeight: '16px'
        }}
      />

      <div className="flex items-center gap-2 pt-2">
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-500"
            >
              <Calendar className="h-3 w-3 mr-1" />
              {deadline 
                ? formatDeadlineDate(deadline)
                : 'Дата'
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={deadline ? (() => {
                try {
                  const date = new Date(deadline + 'T12:00:00');
                  return isValid(date) ? date : undefined;
                } catch {
                  return undefined;
                }
              })() : undefined}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3"
            />
          </PopoverContent>
        </Popover>

        {deadline && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-gray-500" />
            <TimeInput
              value={deadlineTime}
              onChange={setDeadlineTime}
              className="h-6 w-20 text-xs px-2 border-0 bg-transparent focus:bg-white focus:border text-gray-500"
              placeholder="--:--"
            />
          </div>
        )}

        <div className="flex gap-2 ml-auto">
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
