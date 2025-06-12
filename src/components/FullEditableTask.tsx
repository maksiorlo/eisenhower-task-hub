import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { TimeInput } from './TimeInput';
import { TaskModal } from './TaskModal';
import { Trash2, Calendar, Clock, Repeat, Edit } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { RecurrenceSettings } from './RecurrenceSettings';
import { format, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

interface FullEditableTaskProps {
  task: Task;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export function FullEditableTask({ task, onDragStart }: FullEditableTaskProps) {
  const { actions } = useApp();
  const { actions: undoActions } = useUndo();
  const [isEditing, setIsEditing] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRecurrenceOpen, setIsRecurrenceOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [manualDate, setManualDate] = useState(task.deadline || '');
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Helper function to safely format dates
  const formatDeadlineDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T12:00:00');
      if (isValid(date)) {
        return format(date, 'd MMM yyyy', { locale: ru });
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper function to get initial calendar month safely
  const getInitialCalendarMonth = () => {
    if (task.deadline) {
      try {
        const date = new Date(task.deadline + 'T12:00:00');
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
    if (task.deadline) {
      try {
        const date = new Date(task.deadline + 'T12:00:00');
        if (isValid(date)) {
          return date;
        }
      } catch (error) {
        console.error('Error parsing deadline for selection:', error);
      }
    }
    return undefined;
  };

  // Handle keyboard shortcuts for task deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && !isEditing && !editingTime) {
        const activeElement = document.activeElement;
        if (activeElement === document.body || cardRef.current?.contains(activeElement)) {
          e.preventDefault();
          handleDelete();
        }
      }
      if (e.key === 'Enter' && editingTime) {
        e.preventDefault();
        setEditingTime(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editingTime]);

  // Handle click outside to save changes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && cardRef.current && !cardRef.current.contains(event.target as Node)) {
        handleSave();
      }
      if (editingTime && cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setEditingTime(false);
      }
    };

    if (isEditing || editingTime) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, editingTime, title, description]);

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
      // Adjust height for existing content
      if (titleRef.current) {
        titleRef.current.style.height = 'auto';
        titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
      }
      if (descriptionRef.current) {
        descriptionRef.current.style.height = 'auto';
        const lines = description.split('\n').length;
        const maxLines = 6;
        const lineHeight = 16;
        const height = Math.min(lines * lineHeight, maxLines * lineHeight);
        descriptionRef.current.style.height = Math.max(16, height) + 'px';
      }
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
    if (date) {
      // Create date string in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      setManualDate(dateString);
      await actions.updateTask({
        ...task,
        deadline: dateString,
      });
    } else {
      setManualDate('');
      await actions.updateTask({
        ...task,
        deadline: undefined,
      });
    }
    setIsDatePickerOpen(false);
  };

  const handleManualDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setManualDate(dateValue);
    await actions.updateTask({
      ...task,
      deadline: dateValue || undefined,
    });
  };

  const handleTimeUpdate = async (time: string) => {
    await actions.updateTask({
      ...task,
      deadlineTime: time || undefined,
    });
  };

  const handleTimeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTime(true);
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
    if (isEditing || editingTime) {
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't start editing if clicking on specific elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || 
        target.closest('[data-time-input]') || 
        target.closest('[role="dialog"]') ||
        target.closest('.popover-content') ||
        target.closest('[data-radix-popper-content-wrapper]')) {
      return;
    }
    
    if (!isEditing && !editingTime) {
      handleStartEditing();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Save with Enter
        e.preventDefault();
        handleSave();
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, setter: (value: string) => void) => {
    setter(e.target.value);
    // Auto-resize textarea with max height limit for description
    e.target.style.height = 'auto';
    if (e.target === descriptionRef.current) {
      const lines = e.target.value.split('\n').length;
      const maxLines = 6;
      const lineHeight = 16;
      const height = Math.min(lines * lineHeight, maxLines * lineHeight);
      e.target.style.height = Math.max(16, height) + 'px';
    } else {
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline + 'T23:59:59') < new Date() && !task.completed;
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
        ref={cardRef}
        className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer ${
          task.completed ? 'opacity-60' : ''
        }`}
        draggable={!isEditing && !editingTime}
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
                  onChange={(e) => handleTextareaChange(e, setTitle)}
                  onKeyDown={handleKeyDown}
                  className="p-0 border-0 text-sm font-medium resize-none min-h-[20px] focus:outline-none focus:ring-0 focus-visible:ring-0"
                  placeholder="Название задачи"
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
                  className="text-xs border-0 p-0 resize-none min-h-[16px] focus:outline-none focus:ring-0 focus-visible:ring-0 overflow-y-auto"
                  placeholder="Описание задачи..."
                  style={{ 
                    height: 'auto',
                    minHeight: '16px',
                    maxHeight: '96px'
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
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {makeLinksClickable(task.description)}
                  </p>
                )}
              </>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
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
                        ? formatDeadlineDate(task.deadline)
                        : 'Дата'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 popover-content" align="start" onDoubleClick={(e) => e.stopPropagation()}>
                    <div className="p-3">
                      <Input
                        type="date"
                        value={manualDate}
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

              {task.deadline && (
                <div className="flex items-center gap-1" data-time-input>
                  <Clock className={`h-3 w-3 ${deadlineClass}`} />
                  {editingTime ? (
                    <TimeInput
                      value={task.deadlineTime || ''}
                      onChange={handleTimeUpdate}
                      onFinish={() => setEditingTime(false)}
                      className={`h-6 w-20 text-xs px-2 border focus:bg-white ${deadlineClass}`}
                      placeholder="ЧЧ:ММ"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={handleTimeClick}
                      className={`h-6 w-20 text-xs px-2 cursor-pointer hover:bg-gray-100 rounded flex items-center ${deadlineClass}`}
                    >
                      {task.deadlineTime || '--:--'}
                    </span>
                  )}
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
