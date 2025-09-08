
import React from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';

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

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
}

export function TaskCard({ task, onEdit, onDragStart }: TaskCardProps) {
  const { actions } = useApp();

  const handleToggleComplete = async () => {
    await actions.updateTask({
      ...task,
      completed: !task.completed,
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить задачу?')) {
      await actions.deleteTask(task.id);
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !task.completed;
  const deadlineClass = isOverdue ? 'text-red-500' : 'text-gray-500';

  return (
    <div
      className={`p-3 bg-white border rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 ${
        task.completed ? 'opacity-60' : ''
      }`}
      onClick={() => onEdit(task)}
      draggable
      onDragStart={(e) => onDragStart?.(e, task)}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleToggleComplete}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5"
        />
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </h4>
          
          {task.description && (
            <p className={`text-xs mt-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}
          
          {task.deadline && (
            <p className={`text-xs mt-2 ${deadlineClass} ${task.completed ? 'line-through' : ''}`}>
              до {formatDeadlineDate(task.deadline)}
            </p>
          )}
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
