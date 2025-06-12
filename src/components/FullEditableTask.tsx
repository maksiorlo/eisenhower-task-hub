
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Calendar as CalendarIcon } from 'lucide-react';
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
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Update temp values when task changes
  useEffect(() => {
    setTempValues({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline || '',
      deadlineTime: task.deadlineTime || ''
    });
  }, [task]);

  const isEditing = (field: string) => editingField === field;

  const startEdit = (field: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (editingField === field) return;
    
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
          // Create date with time
          const date = new Date(tempValues.deadline + 'T00:00:00');
          const [hours, minutes] = tempValues.deadlineTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes));
          updatedTask.deadline = date.toISOString();
          updatedTask.deadlineTime = tempValues.deadlineTime;
        } else if (tempValues.deadline && !tempValues.deadlineTime) {
          // Date only
          const date = new Date(tempValues.deadline + 'T00:00:00');
          updatedTask.deadline = date.toISOString();
          updatedTask.deadlineTime = '';
        } else if (!tempValues.deadline) {
          // Clear deadline
          updatedTask.deadline = '';
          updatedTask.deadlineTime = '';
        }
      }
      
      await actions.updateTask(updatedTask);
      onEdit(updatedTask);
    } else {
      setTempValues({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline || '',
        deadlineTime: task.deadlineTime || ''
      });
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
      
      setTempValues(prev => ({ ...prev, deadline: newDeadline }));
      
      let updatedTask = { ...task, deadline: new Date(newDeadline + 'T00:00:00').toISOString(), deadlineTime: tempValues.deadlineTime };
      if (tempValues.deadlineTime) {
        const [hours, minutes] = tempValues.deadlineTime.split(':');
        const dateWithTime = new Date(newDeadline + 'T00:00:00');
        dateWithTime.setHours(parseInt(hours), parseInt(minutes));
        updatedTask.deadline = dateWithTime.toISOString();
      }
      
      await actions.updateTask(updatedTask);
      onEdit(updatedTask);
    }
    setShowCalendar(false);
  };

  const handleManualDateInput = (value: string) => {
    setTempValues(prev => ({ ...prev, deadline: value }));
  };

  const handleManualDateFinish = async () => {
    if (tempValues.deadline) {
      try {
        const date = new Date(tempValues.deadline + 'T00:00:00');
        if (!isNaN(date.getTime())) {
          let updatedTask = { ...task, deadline: date.toISOString(), deadlineTime: tempValues.deadlineTime };
          if (tempValues.deadlineTime) {
            const [hours, minutes] = tempValues.deadlineTime.split(':');
            date.setHours(parseInt(hours), parseInt(minutes));
            updatedTask.deadline = date.toISOString();
          }
          await actions.updateTask(updatedTask);
          onEdit(updatedTask);
        }
      } catch (error) {
        console.error('Invalid date:', error);
      }
    }
  };

  const handleTimeFinish = async () => {
    await finishEdit('time', true);
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
                onFinish={handleTimeFinish}
                className="text-xs h-6 w-16"
                autoFocus
              />
            </div>
          ) : null}
          
          {/* Deadline */}
          <div className="mt-2 flex items-center gap-2">
            {!isEditing('time') && renderDeadlineDisplay()}
            
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <CalendarIcon className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" onDoubleClick={(e) => e.stopPropagation()}>
                <div className="p-3 space-y-2">
                  <Input
                    type="date"
                    value={tempValues.deadline ? tempValues.deadline.split('T')[0] : ''}
                    onChange={(e) => handleManualDateInput(e.target.value)}
                    onBlur={handleManualDateFinish}
                    className="text-xs"
                    style={{ direction: 'ltr' }}
                  />
                  <Calendar
                    mode="single"
                    selected={tempValues.deadline ? parseISO(tempValues.deadline) : undefined}
                    onSelect={handleDateSelect}
                    defaultMonth={getCurrentMonth()}
                    locale={ru}
                    weekStartsOn={1}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

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
  );
}
