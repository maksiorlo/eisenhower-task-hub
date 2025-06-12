
import React, { useState, useRef } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Calendar as CalendarIcon, Clock, Repeat, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimeInput } from './TimeInput';

interface FullEditableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export function FullEditableTask({ task, onEdit, onDragStart }: FullEditableTaskProps) {
  const { actions } = useApp();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState({
    title: task.title,
    description: task.description || '',
    deadline: task.deadline || '',
    deadlineTime: task.deadlineTime || ''
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const isEditing = (field: string) => editingField === field;

  const startEdit = (field: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (editingField === field) return;
    
    // Initialize temp values when starting to edit
    setTempValues({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline || '',
      deadlineTime: task.deadlineTime || ''
    });
    
    setEditingField(field);
    
    setTimeout(() => {
      if (field === 'title' && titleRef.current) {
        titleRef.current.focus();
        titleRef.current.select();
      } else if (field === 'description' && descriptionRef.current) {
        descriptionRef.current.focus();
        descriptionRef.current.select();
      }
    }, 0);
  };

  const finishEdit = async (field: string, save: boolean = true) => {
    if (!isEditing(field)) return;
    
    if (save) {
      let updatedTask = { ...task };
      
      if (field === 'title') {
        updatedTask.title = tempValues.title.trim() || task.title;
      } else if (field === 'description') {
        updatedTask.description = tempValues.description.trim();
      } else if (field === 'time' || field === 'deadline') {
        if (tempValues.deadline && tempValues.deadlineTime) {
          const date = new Date(tempValues.deadline + 'T00:00:00');
          const [hours, minutes] = tempValues.deadlineTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
          updatedTask.deadline = date.toISOString();
          updatedTask.deadlineTime = tempValues.deadlineTime;
        } else if (tempValues.deadline && !tempValues.deadlineTime) {
          const date = new Date(tempValues.deadline + 'T00:00:00');
          updatedTask.deadline = date.toISOString();
          updatedTask.deadlineTime = '';
        } else if (!tempValues.deadline) {
          updatedTask.deadline = '';
          updatedTask.deadlineTime = '';
        }
      }
      
      await actions.updateTask(updatedTask);
      onEdit(updatedTask);
    }
    
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && field !== 'description') {
      e.preventDefault();
      finishEdit(field, true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finishEdit(field, false);
    }
  };

  const handleToggleComplete = async (checked: boolean | string) => {
    const newCompleted = checked === true;
    const updatedTask = {
      ...task,
      completed: newCompleted,
    };
    await actions.updateTask(updatedTask);
    onEdit(updatedTask);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить задачу?')) {
      await actions.deleteTask(task.id);
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const newDeadline = localDate.toISOString().split('T')[0];
      
      let updatedTask = { ...task, deadline: new Date(newDeadline + 'T00:00:00').toISOString(), deadlineTime: task.deadlineTime || '' };
      if (task.deadlineTime) {
        const [hours, minutes] = task.deadlineTime.split(':');
        const dateWithTime = new Date(newDeadline + 'T00:00:00');
        dateWithTime.setHours(parseInt(hours), parseInt(minutes));
        updatedTask.deadline = dateWithTime.toISOString();
      }
      
      await actions.updateTask(updatedTask);
      onEdit(updatedTask);
    }
    setShowCalendar(false);
  };

  const handleTimeUpdate = async (time: string) => {
    let updatedTask = { ...task, deadlineTime: time };
    if (task.deadline && time) {
      const date = new Date(task.deadline);
      const [hours, minutes] = time.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      updatedTask.deadline = date.toISOString();
    }
    await actions.updateTask(updatedTask);
    onEdit(updatedTask);
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;

  const renderDeadlineDisplay = () => {
    if (!task.deadline) {
      return (
        <div className="text-xs text-gray-500">
          <span>--:--</span>
        </div>
      );
    }

    const date = parseISO(task.deadline);
    const timeStr = task.deadlineTime || (format(date, 'HH:mm') !== '00:00' ? format(date, 'HH:mm') : '');
    const dateStr = format(date, 'd MMM yyyy', { locale: ru });

    return (
      <div className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
        <span>до {dateStr}</span>
        {timeStr ? (
          <span 
            className={`ml-2 cursor-pointer hover:bg-gray-100 px-1 rounded ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}
            onClick={(e) => startEdit('time', e)}
          >
            {timeStr}
          </span>
        ) : (
          <span 
            className={`ml-2 cursor-pointer hover:bg-gray-100 px-1 rounded ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}
            onClick={(e) => startEdit('time', e)}
          >
            --:--
          </span>
        )}
      </div>
    );
  };

  const getCurrentMonth = () => {
    if (task.deadline) {
      return parseISO(task.deadline);
    }
    return new Date();
  };

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

  return (
    <div
      className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group ${
        task.completed ? 'opacity-60' : ''
      }`}
      draggable={!editingField}
      onDragStart={(e) => !editingField && onDragStart?.(e, task)}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          className="mt-0.5 flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          {isEditing('title') ? (
            <Input
              ref={titleRef}
              value={tempValues.title}
              onChange={(e) => setTempValues(prev => ({ ...prev, title: e.target.value }))}
              onBlur={() => finishEdit('title', true)}
              onKeyDown={(e) => handleKeyDown(e, 'title')}
              className="text-sm font-medium mb-1 h-8 p-1"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h4 
              className={`font-medium text-sm cursor-pointer hover:bg-gray-50 p-1 rounded ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
              onClick={(e) => startEdit('title', e)}
            >
              {task.title}
            </h4>
          )}
          
          {/* Description */}
          {isEditing('description') ? (
            <Textarea
              ref={descriptionRef}
              value={tempValues.description}
              onChange={(e) => setTempValues(prev => ({ ...prev, description: e.target.value }))}
              onBlur={() => finishEdit('description', true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  finishEdit('description', false);
                }
              }}
              className="text-xs mt-1 min-h-[60px] resize-none p-1"
              placeholder="Описание задачи..."
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div 
              className={`text-xs mt-1 cursor-pointer hover:bg-gray-50 p-1 rounded ${
                task.completed ? 'line-through text-gray-400' : 'text-gray-600'
              }`}
              onClick={(e) => startEdit('description', e)}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {task.description || 'Добавить описание...'}
            </div>
          )}
          
          {/* Time editing */}
          {isEditing('time') ? (
            <div className="mt-2">
              <TimeInput
                value={tempValues.deadlineTime}
                onChange={(value) => setTempValues(prev => ({ ...prev, deadlineTime: value }))}
                onFinish={() => finishEdit('time', true)}
                className="text-xs h-6 w-16"
                autoFocus
              />
            </div>
          ) : null}
          
          {/* Deadline and interactive elements */}
          <div className="mt-2 flex items-center gap-2">
            {!isEditing('time') && renderDeadlineDisplay()}
            
            {/* Calendar button */}
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                  <CalendarIcon className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={task.deadline ? parseISO(task.deadline) : undefined}
                  onSelect={handleDateSelect}
                  defaultMonth={getCurrentMonth()}
                  locale={ru}
                  weekStartsOn={1}
                />
              </PopoverContent>
            </Popover>

            {/* Time button */}
            {task.deadline && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
                onClick={(e) => startEdit('time', e)}
              >
                <Clock className="h-3 w-3 mr-1" />
                {task.deadlineTime || '--:--'}
              </Button>
            )}

            {/* Recurrence button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-6 px-2 text-xs opacity-0 group-hover:opacity-100 ${task.isRecurring ? 'text-blue-600' : 'text-gray-500'}`}
            >
              <Repeat className="h-3 w-3 mr-1" />
              {task.isRecurring ? getRecurrenceDisplay() : 'Повтор'}
            </Button>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto opacity-0 group-hover:opacity-100 hover:bg-blue-100 flex-shrink-0"
          >
            <Edit className="h-3 w-3 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="p-1 h-auto opacity-0 group-hover:opacity-100 hover:bg-red-100 flex-shrink-0"
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
