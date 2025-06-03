
import React, { useState } from 'react';
import { Task } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function MatrixBoard() {
  const { state, actions } = useApp();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultQuadrant, setDefaultQuadrant] = useState<Task['quadrant'] | undefined>();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  if (!state.currentProject) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Выберите или создайте проект для начала работы
      </div>
    );
  }

  const getTasksByQuadrant = (quadrant: Task['quadrant']) => {
    return state.tasks
      .filter(task => task.quadrant === quadrant)
      .sort((a, b) => {
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
    setSelectedTask(null);
    setDefaultQuadrant(quadrant);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDefaultQuadrant(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setDefaultQuadrant(undefined);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetQuadrant: Task['quadrant']) => {
    e.preventDefault();
    if (draggedTask && draggedTask.quadrant !== targetQuadrant) {
      await actions.updateTask({
        ...draggedTask,
        quadrant: targetQuadrant,
      });
    }
    setDraggedTask(null);
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
          
          return (
            <div
              key={quadrant.id}
              className={`border-2 rounded-lg ${quadrant.color} min-h-[300px]`}
              onDragOver={handleDragOver}
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
                {tasks.map((task) => (
                  <div key={task.id} className="group">
                    <TaskCard
                      task={task}
                      onEdit={handleEditTask}
                      onDragStart={handleDragStart}
                    />
                  </div>
                ))}
                
                {tasks.length === 0 && (
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

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        defaultQuadrant={defaultQuadrant}
      />
    </div>
  );
}
