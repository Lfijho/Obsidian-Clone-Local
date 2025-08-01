import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger 
} from '@/components/ui/context-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  File, 
  Folder as FolderIcon, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Edit 
} from 'lucide-react';
import { useNotes, Note, Folder } from '@/hooks/useNotes';
import { FileUpload } from './FileUpload';

interface FileExplorerProps {
  onNoteSelect: (note: Note) => void;
  currentNote: Note | null;
}

export const FileExplorer = ({ onNoteSelect, currentNote }: FileExplorerProps) => {
  const { 
    notes, 
    folders, 
    createNote, 
    createFolder, 
    deleteNote, 
    deleteFolder 
  } = useNotes();
  
  const [showNewNote, setShowNewNote] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleCreateNote = async () => {
    if (!newNoteName.trim()) return;
    
    await createNote(newNoteName, selectedFolderId || undefined);
    setNewNoteName('');
    setShowNewNote(false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    await createFolder(newFolderName);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const renderFolderContents = (parentId: string | null = null) => {
    const folderItems = folders.filter(folder => folder.parent_folder_id === parentId);
    const noteItems = notes.filter(note => note.folder_id === parentId);

    return (
      <>
        {folderItems.map(folder => (
          <ContextMenu key={folder.id}>
            <ContextMenuTrigger>
              <div className="flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md cursor-pointer">
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{folder.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => deleteFolder(folder.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Pasta
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
        
        {noteItems.map(note => (
          <ContextMenu key={note.id}>
            <ContextMenuTrigger>
              <div 
                className={`flex items-center gap-2 p-2 hover:bg-sidebar-accent rounded-md cursor-pointer ${
                  currentNote?.id === note.id ? 'bg-sidebar-accent' : ''
                }`}
                onClick={() => onNoteSelect(note)}
              >
                <File className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{note.title}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => deleteNote(note.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Nota
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </>
    );
  };

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground mb-3">Arquivos</h2>
        
        <div className="flex gap-2 mb-2">
          <Dialog open={showNewNote} onOpenChange={setShowNewNote}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Plus className="h-4 w-4 mr-1" />
                Nota
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Nota</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note-name">Nome da nota</Label>
                  <Input
                    id="note-name"
                    value={newNoteName}
                    onChange={(e) => setNewNoteName(e.target.value)}
                    placeholder="Digite o nome da nota..."
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateNote()}
                  />
                </div>
                <Button onClick={handleCreateNote} className="w-full">
                  Criar Nota
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Pasta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Nome da pasta</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Digite o nome da pasta..."
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>
                <Button onClick={handleCreateFolder} className="w-full">
                  Criar Pasta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-3">
          <FileUpload />
        </div>
      </div>

      <div className="p-2 overflow-y-auto">
        {renderFolderContents()}
      </div>
    </div>
  );
};