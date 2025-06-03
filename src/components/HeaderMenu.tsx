
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Download, Keyboard } from 'lucide-react';
import { ExportData } from './ExportData';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

export function HeaderMenu() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <ExportData />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
            <Keyboard className="h-4 w-4 mr-2" />
            Горячие клавиши
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
