import React from 'react';
import { TopBar } from './TopBar';
import { FileExplorer } from './FileExplorer';
import { MarkdownEditor } from './MarkdownEditor';
import { Sidebar } from './Sidebar';
import { useNotes } from '@/hooks/useNotes';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export const MainApp = () => {
  const { currentNote, setCurrentNote } = useNotes();

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar />
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <FileExplorer 
              onNoteSelect={setCurrentNote} 
              currentNote={currentNote} 
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Main Editor */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <MarkdownEditor note={currentNote} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Sidebar */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <Sidebar 
              currentNote={currentNote} 
              onNoteSelect={setCurrentNote} 
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};