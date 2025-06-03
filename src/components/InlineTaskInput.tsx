
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Task } from '../services/StorageService';
import { Input } from '@/components/ui/input';

interface InlineTaskInputProps {
  quadrant: Task['quadrant'];
  onCancel?: () => void;
}

export function InlineTaskInput({ quadrant, onCancel }: InlineTaskInputProps) {
  const { state, actions } = useApp();
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !state.currentProject) return;

    await actions.createTask({
      title: title.trim(),
      description: '',
      quadrant,
      projectId: state.currentProject.id,
      completed: false,
    });

    setTitle('');
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Введите название задачи..."
        autoFocus
        onBlur={onCancel}
        onKeyDown={handleKeyDown}
        className="create-task-input border-0 p-0 h-auto text-sm font-medium focus-visible:ring-0"
      />
    </form>
  );
}
