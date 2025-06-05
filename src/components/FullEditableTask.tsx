
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { TimeInput } from './TimeInput';
import { TaskModal } from './TaskModal';
import { Trash2, Calendar, Clock, Repeat, Edit } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { RecurrenceSettings } from './RecurrenceSettings';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FullEditableTaskProps {
  task: Task;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export function FullEditableTask({ task, onDragStart }: FullEditableTaskProps) {
  const { actions } = useApp();
  const { actions: undoActions } = useUndo();
  const [isEditing, setIsEditing] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRecurrenceOpen, setIsRecurrenceOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Handle keyboard shortcuts for task deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && isSelected && !isEditing) {
        e.preventDefault();
        handleDelete();
      }
    };

    if (isSelected) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelected, isEditing]);

  const handleToggleComplete = async () => {
    const updatedTask = {
      ...task,
      completed: !task.completed,
    };

    await actions.updateTask(updatedTask);

    // Create recurring task if this task is completed and has recurrence
    if (!task.completed && task.isRecurring && task.recurrencePattern) {
      try {
        await actions.createRecurringTask(task);
      } catch (error) {
        console.error('Failed to create recurring task:', error);
      }
    }
  };

  const handleDelete = async () => {
    undoActions.addDeletedTask(task);
    await actions.deleteTask(task.id);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setTitle(task.title);
    setDescription(task.description || '');
    setTimeout(() => {
      titleRef.current?.focus();
    }, 0);
  };

  const handleSave = async () => {
    if (title.trim() !== task.title || description !== (task.description || '')) {
      await actions.updateTask({
        ...task,
        title: title.trim() || task.title,
        description: description.trim() || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(task.title);
    setDescription(task.description || '');
    setIsEditing(false);
  };

  const handleDateSelect = async (date: Date | undefined) => {
    await actions.updateTask({
      ...task,
      deadline: date ? date.toISOString().split('T')[0] : undefined,
    });
    setIsDatePickerOpen(false);
  };

  const handleTimeUpdate = async (time: string) => {
    await actions.updateTask({
      ...task,
      deadlineTime: time,
    });
  };

  const handleRecurrenceUpdate = async (isRecurring: boolean, pattern?: any) => {
    await actions.updateTask({
      ...task,
      isRecurring,
      recurrencePattern: pattern,
    });
  };

  const handleDragStartWithData = (e: React.DragEvent) => {
    // Don't allow drag if editing
    if (isEditing) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart?.(e, task);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleCardClick = () => {
    if (!isEditing) {
      setIsSelected(true);
      handleStartEditing();
      // Remove selection after a short delay
      setTimeout(() => setIsSelected(false), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
  const deadlineClass = isOverdue ? 'text-red-500' : 'text-gray-500';

  const getRecurrenceDisplay = () => {
    if (!task.isRecurring || !task.recurrencePattern) return null;
    
    const pattern = task.recurrencePattern;
    switch (pattern.type) {
      case 'daily':
        return pattern.interval === 1 ? 'ежедневно' : `каждые ${pattern.interval} дня`;
      case 'weekly':
        return 'еженедельно';
      case 'weekdays':
        return 'по будням';
      case 'weekends':
        return 'по выходным';
      case 'custom':
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        const selectedDays = pattern.daysOfWeek?.map(day => days[day]).join(', ');
        return selectedDays ? `по: ${selectedDays}` : 'настраиваемое';
      default:
        return 'повтор';
    }
  };

  const makeLinksClickable = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
      <div
        className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${
          task.completed ? 'opacity-60' : ''
        } ${isEditing ? 'ring-2 ring-blue-200' : ''}`}
        draggable={!isEditing}
        onDragStart={handleDragStartWithData}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-0.5"
            onClick={(e) => e.stopPropagation()}
          />
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="p-0 border-0 text-sm font-medium focus-visible:ring-0 resize-none min-h-[20px]"
                  placeholder="Название задачи"
                  rows={Math.max(1, title.split('\n').length)}
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
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-xs border-0 p-0 resize-none focus-visible:ring-0 min-h-[60px]"
                  placeholder="Описание задачи..."
                  rows={Math.max(4, description.split('\n').length)}
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
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSave}>
                    Сохранить
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h4
                  className={`font-medium text-sm cursor-text break-words whitespace-pre-wrap leading-tight ${
                    task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {makeLinksClickable(task.title)}
                </h4>
                
                {task.description && (
                  <p
                    className={`text-xs mt-1 cursor-text break-words whitespace-pre-wrap leading-tight ${
                      task.completed ? 'line-through text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {makeLinksClickable(task.description)}
                  </p>
                )}
              </>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-2 text-xs ${deadlineClass} ${task.completed ? 'line-through' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.deadline 
                      ? format(new Date(task.deadline), 'd MMM yyyy', { locale: ru })
                      : 'Дата'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={task.deadline ? new Date(task.deadline) : undefined}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {task.deadline && (
                <div className="flex items-center gap-1">
                  <Clock className={`h-3 w-3 ${deadlineClass}`} />
                  <TimeInput
                    value={task.deadlineTime || ''}
                    onChange={handleTimeUpdate}
                    className={`h-6 w-20 text-xs px-2 border-0 bg-transparent focus:bg-white focus:border ${deadlineClass}`}
                    placeholder="--:--"
                  />
                </div>
              )}

              <Popover open={isRecurrenceOpen} onOpenChange={setIsRecurrenceOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-2 text-xs ${task.isRecurring ? 'text-blue-600' : 'text-gray-500'}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Repeat className="h-3 w-3 mr-1" />
                    {task.isRecurring ? getRecurrenceDisplay() : 'Повтор'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3" align="start">
                  <RecurrenceSettings
                    isRecurring={task.isRecurring || false}
                    pattern={task.recurrencePattern}
                    onRecurrenceChange={handleRecurrenceUpdate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenModal}
              className="p-1 h-auto opacity-0 group-hover:opacity-100 hover:bg-blue-100"
            >
              <Edit className="h-3 w-3 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="p-1 h-auto opacity-0 group-hover:opacity-100 hover:bg-red-100"
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        </div>
      </div>

      <TaskModal
        task={task}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
