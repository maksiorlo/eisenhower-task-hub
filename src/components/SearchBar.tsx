
import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchBar() {
  const { state, actions } = useApp();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    actions.searchTasks(query);
  };

  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Поиск задач..."
        value={state.searchQuery}
        onChange={handleSearch}
        className="pl-10"
      />
    </div>
  );
}
