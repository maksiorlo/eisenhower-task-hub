
import React from 'react';
import { AppProvider } from '../contexts/AppContext';
import { ProjectSelector } from '../components/ProjectSelector';
import { SearchBar } from '../components/SearchBar';
import { MatrixBoard } from '../components/MatrixBoard';

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Матрица Эйзенхауэра
          </h1>
          <p className="text-gray-600">
            Управляйте задачами по приоритету и срочности
          </p>
        </header>

        <div className="space-y-6">
          <ProjectSelector />
          <SearchBar />
          <MatrixBoard />
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
