
import React, { useState } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { useUndo } from '../contexts/UndoContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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

  const handleToggleComplete = async () => {
    await actions.updateTask({
      ...task,
      completed: !task.completed,
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      deadline: date ? date.toISOString() : undefined,
    });
    setIsDatePickerOpen(false);
  };

  const handleDragStartWithData = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart?.(e, task);
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
  const deadlineClass = isOverdue ? 'text-red-500' : 'text-gray-500';

  return (
    <div
      className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group ${
        task.completed ? 'opacity-60' : ''
      }`}
      draggable
      onDragStart={handleDragStartWithData}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          className="mt-0.5"
        />
        
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <Input
              defaultValue={task.title}
              autoFocus
              onBlur={(e) => handleTitleUpdate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleUpdate(e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                }
              }}
              className="h-auto p-0 border-0 text-sm font-medium focus-visible:ring-0"
            />
          ) : (
            <h4
              className={`font-medium text-sm cursor-text ${
                task.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}
              onClick={() => setIsEditingTitle(true)}
            >
              {task.title}
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
              className="mt-1 min-h-[60px] text-xs border-0 p-0 resize-none focus-visible:ring-0"
              placeholder="Добавить описание..."
            />
          ) : (
            <p
              className={`text-xs mt-1 cursor-text min-h-[16px] ${
                task.completed ? 'line-through text-gray-400' : 'text-gray-600'
              } ${!task.description ? 'text-gray-400' : ''}`}
              onClick={() => setIsEditingDescription(true)}
            >
              {task.description || 'Добавить описание...'}
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
          </div>
        </div>

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
  );
}
