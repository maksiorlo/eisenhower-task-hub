
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    {
      category: 'Основные действия',
      items: [
        { key: 'Cmd/Ctrl + N', description: 'Новая задача' },
        { key: 'Cmd/Ctrl + Z', description: 'Отмена последнего действия' },
        { key: '/', description: 'Фокус на поиске' },
      ]
    },
    {
      category: 'Навигация',
      items: [
        { key: '← →', description: 'Переключение между проектами' },
        { key: '↑ ↓', description: 'Навигация по задачам' },
      ]
    },
    {
      category: 'Drag & Drop',
      items: [
        { key: 'Перетаскивание задач', description: 'Между квадрантами и проектами' },
        { key: 'Перетаскивание проектов', description: 'Изменение порядка в сайдбаре' },
        { key: 'Архивирование', description: 'Перетащите проект в архив' },
      ]
    },
    {
      category: 'Контекстное меню',
      items: [
        { key: 'ПКМ по задаче', description: 'Удалить, архивировать, перенести' },
        { key: 'Долгое нажатие', description: 'Контекстное меню на мобильных' },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Горячие клавиши и навигация</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {shortcuts.map((section, index) => (
              <div key={section.category}>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between">
                      <span className="text-sm">{item.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.key}
                      </Badge>
                    </div>
                  ))}
                </div>
                {index < shortcuts.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
