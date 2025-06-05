
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Download, Keyboard, Upload } from 'lucide-react';
import { ExportData } from './ExportData';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { useToast } from '@/hooks/use-toast';
import { storageService } from '../services/StorageService';
import { useApp } from '../contexts/AppContext';

export function HeaderMenu() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { toast } = useToast();
  const { actions } = useApp();

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          if (jsonData && typeof jsonData === 'object') {
            // Basic validation - check if projects and tasks are present
            if (Array.isArray(jsonData.projects) && Array.isArray(jsonData.tasks)) {
              // Import projects
              for (const project of jsonData.projects) {
                await storageService.saveProject(project);
              }
              // Import tasks
              for (const task of jsonData.tasks) {
                await storageService.saveTask(task);
              }

              await actions.loadData(); // Reload all data
              toast({
                title: "Импорт успешен",
                description: "Данные успешно импортированы",
              });
            } else {
              toast({
                title: "Ошибка импорта",
                description: "Неверный формат файла. Ожидается объект с массивами 'projects' и 'tasks'.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Ошибка импорта",
              description: "Неверный формат файла. Ожидается JSON.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Failed to import data:", error);
          toast({
            title: "Ошибка импорта",
            description: "Не удалось обработать файл. Возможно, файл поврежден или имеет неверный формат.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={() => setShowShortcuts(true)}
            className="flex items-center w-full"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Горячие клавиши
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <label className="flex items-center w-full cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Импорт
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <ExportData />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <KeyboardShortcutsModal 
        open={showShortcuts} 
        onOpenChange={setShowShortcuts} 
      />
    </>
  );
}
