
import React from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export function ExportData() {
  const { state } = useApp();
  const { toast } = useToast();

  const exportData = () => {
    try {
      const exportData = {
        projects: state.projects,
        tasks: state.tasks,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `task-matrix-export-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      toast({
        title: "Экспорт завершен",
        description: "Данные успешно экспортированы",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2 w-full" onClick={exportData}>
      <Download className="h-4 w-4" />
      Экспорт данных
    </div>
  );
}
