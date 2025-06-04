
import React, { useState } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { InlineEditableTask } from './InlineEditableTask';
import { InlineTaskInput } from './InlineTaskInput';
import { TaskContextMenu } from './TaskContextMenu';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export function MatrixBoard() {
  const { state, actions } = useApp();
  const [creatingInQuadrant, setCreatingInQuadrant] = useState<Task['quadrant'] | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<Task['quadrant'] | null>(null);

  useKeyboardShortcuts();

  if (!state.currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Выберите или создайте проект для начала работы
      </div>
    );
  }

  const getTasksByQuadrant = (quadrant: Task['quadrant']) => {
    const filteredTasks = state.tasks.filter(task => task.quadrant === quadrant);
    
    // Sort: completed tasks at bottom, then by order (if exists), then by deadline proximity
    return filteredTasks.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Sort by custom order if exists
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      
      // Sort by deadline (closest first), then by creation date
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const handleCreateTask = (quadrant: Task['quadrant']) => {
    setCreatingInQuadrant(quadrant);
  };

  const handleCancelCreate = () => {
    setCreatingInQuadrant(null);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    // Create custom drag image
    const dragElement = document.createElement('div');
    dragElement.innerHTML = task.title;
    dragElement.style.cssText = `
      position: absolute;
      top: -1000px;
      background: white;
      padding: 8px 12px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
      max-width: 200px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      border: 1px solid #e2e8f0;
    `;
    document.body.appendChild(dragElement);
    e.dataTransfer.setDragImage(dragElement, 10, 10);
    
    setTimeout(() => document.body.removeChild(dragElement), 0);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverQuadrant(null);
  };

  const handleDragOver = (e: React.DragEvent, quadrant: Task['quadrant']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverQuadrant(quadrant);
  };

  const handleDragLeave = () => {
    setDragOverQuadrant(null);
  };

  const handleDrop = async (e: React.DragEvent, targetQuadrant: Task['quadrant']) => {
    e.preventDefault();
    setDragOverQuadrant(null);
    
    if (draggedTask && draggedTask.quadrant !== targetQuadrant) {
      await actions.updateTask({
        ...draggedTask,
        quadrant: targetQuadrant,
      });
    }
    setDraggedTask(null);
  };

  const reorderTasks = async (quadrant: Task['quadrant'], dragIndex: number, hoverIndex: number) => {
    const tasks = getTasksByQuadrant(quadrant);
    const draggedTask = tasks[dragIndex];
    const newTasks = [...tasks];
    
    // Remove dragged task and insert at new position
    newTasks.splice(dragIndex, 1);
    newTasks.splice(hoverIndex, 0, draggedTask);
    
    // Update order for all tasks in quadrant
    for (let i = 0; i < newTasks.length; i++) {
      await actions.updateTask({
        ...newTasks[i],
        order: i,
      });
    }
  };

  const quadrants = [
    {
      id: 'urgent-important' as const,
      title: 'Срочно и важно',
      subtitle: 'Сделать немедленно',
      color: 'border-red-200 bg-red-50',
      headerColor: 'bg-red-100 text-red-800',
    },
    {
      id: 'important-not-urgent' as const,
      title: 'Важно, не срочно',
      subtitle: 'Запланировать',
      color: 'border-green-200 bg-green-50',
      headerColor: 'bg-green-100 text-green-800',
    },
    {
      id: 'urgent-not-important' as const,
      title: 'Срочно, не важно',
      subtitle: 'Делегировать',
      color: 'border-yellow-200 bg-yellow-50',
      headerColor: 'bg-yellow-100 text-yellow-800',
    },
    {
      id: 'not-urgent-not-important' as const,
      title: 'Не срочно и не важно',
      subtitle: 'Исключить',
      color: 'border-gray-200 bg-gray-50',
      headerColor: 'bg-gray-100 text-gray-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quadrants.map((quadrant) => {
          const tasks = getTasksByQuadrant(quadrant.id);
          const isDropTarget = dragOverQuadrant === quadrant.id;
          
          return (
            <div
              key={quadrant.id}
              data-quadrant={quadrant.id}
              className={`border-2 rounded-lg ${quadrant.color} min-h-[300px] transition-all ${
                isDropTarget ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, quadrant.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, quadrant.id)}
            >
              <div className={`p-4 rounded-t-lg ${quadrant.headerColor} flex items-center justify-between`}>
                <div>
                  <h3 className="font-semibold text-sm">{quadrant.title}</h3>
                  <p className="text-xs opacity-75">{quadrant.subtitle}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCreateTask(quadrant.id)}
                  className="p-1 h-auto hover:bg-white/50"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4 space-y-3">
                {creatingInQuadrant === quadrant.id && (
                  <InlineTaskInput
                    quadrant={quadrant.id}
                    onCancel={handleCancelCreate}
                  />
                )}
                
                {tasks.map((task, index) => (
                  <TaskContextMenu key={task.id} task={task}>
                    <div>
                      <InlineEditableTask
                        task={task}
                        onDragStart={handleDragStart}
                      />
                    </div>
                  </TaskContextMenu>
                ))}
                
                {tasks.length === 0 && creatingInQuadrant !== quadrant.id && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">Нет задач</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreateTask(quadrant.id)}
                      className="mt-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Добавить задачу
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
