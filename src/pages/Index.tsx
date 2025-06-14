
import React from 'react';
import { ThemeProvider } from 'next-themes';
import { AppProvider } from '../contexts/AppContext';
import { UndoProvider } from '../contexts/UndoContext';
import { SearchBar } from '../components/SearchBar';
import { MatrixBoard } from '../components/MatrixBoard';
import { AppSidebar } from '../components/AppSidebar';
import { HeaderMenu } from '../components/HeaderMenu';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';

function AppContent() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-1">
                <SearchBar />
              </div>
              <HeaderMenu />
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <MatrixBoard />
            </div>
          </div>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

const Index = () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <UndoProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </UndoProvider>
    </ThemeProvider>
  );
};

export default Index;
