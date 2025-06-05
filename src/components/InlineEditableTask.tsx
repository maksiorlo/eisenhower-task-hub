
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TimeInput } from './TimeInput';
import { TaskModal } from './TaskModal';
import { Trash2, Calendar, Clock, Repeat, Edit } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { RecurrenceSettings } from './RecurrenceSettings';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface InlineEditableTaskProps {
  task: Task;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export function InlineEditableTask({ task, onDragStart }: InlineEditableTaskProps) {
  const { actions } = useApp();
  const { actions: undoActions } = useUndo();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRecurrenceOpen, setIsRecurrenceOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Handle keyboard shortcuts for task deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && isSelected && !isEditingTitle && !isEditingDescription) {
        e.preventDefault();
        handleDelete();
      }
    };

    if (isSelected) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSelected, isEditingTitle, isEditingDescription]);

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

  const handleTitleUpdate = async (newTitle: string) => {
    if (newTitle.trim() && newTitle !== task.title) {
      await actions.updateTask({
        ...task,
        title: newTitle.trim(),
      });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionUpdate = async (newDescription: string) => {
    if (newDescription !== task.description) {
      await actions.updateTask({
        ...task,
        description: newDescription,
      });
    }
    setIsEditingDescription(false);
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
    if (isEditingTitle || isEditingDescription) {
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
    setIsSelected(true);
    // Remove selection after a short delay to allow for keyboard events
    setTimeout(() => setIsSelected(false), 100);
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

  const truncateText = (text: string, maxLines: number = 6) => {
    const lines = text.split('\n');
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join('\n') + '...';
    }
    return text;
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

  const getTitleHeight = () => {
    if (!titleRef.current) return 'auto';
    return `${titleRef.current.scrollHeight}px`;
  };

  return (
    <>
      <div
        className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${
          task.completed ? 'opacity-60' : ''
        }`}
        draggable={!isEditingTitle && !isEditingDescription}
        onDragStart={handleDragStartWithData}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.completed}
            onCheckedChange={handleToggleComplete}
            className="mt-0.5"
          />
          
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <Textarea
                defaultValue={task.title}
                autoFocus
                onBlur={(e) => handleTitleUpdate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTitleUpdate(e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false);
                  }
                }}
                className="h-auto p-0 border-0 text-sm font-medium focus-visible:ring-0 resize-none"
                style={{ height: getTitleHeight() }}
                rows={Math.max(1, task.title.split('\n').length)}
              />
            ) : (
              <h4
                ref={titleRef}
                className={`font-medium text-sm cursor-text break-words whitespace-pre-wrap leading-tight ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}
                onClick={() => setIsEditingTitle(true)}
              >
                {makeLinksClickable(task.title)}
              </h4>
            )}
            
            {isEditingDescription ? (
              <Textarea
                defaultValue={task.description}
                autoFocus
                onBlur={(e) => handleDescriptionUpdate(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditingDescription(false);
                  }
                }}
                className="mt-1 min-h-[96px] text-xs border-0 p-0 resize-none focus-visible:ring-0"
                placeholder="Добавить описание..."
                rows={6}
              />
            ) : (
              <p
                className={`text-xs mt-1 cursor-text min-h-[16px] break-words whitespace-pre-wrap leading-tight max-h-[96px] overflow-hidden ${
                  task.completed ? 'line-through text-gray-400' : 'text-gray-600'
                } ${!task.description ? 'text-gray-400' : ''}`}
                onClick={() => setIsEditingDescription(true)}
              >
                {task.description ? makeLinksClickable(truncateText(task.description)) : 'Добавить описание...'}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 px-2 text-xs ${deadlineClass} ${task.completed ? 'line-through' : ''}`}
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
              onClick={handleDelete}
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
