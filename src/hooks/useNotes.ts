import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Note {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  // Load notes and folders
  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [notesResponse, foldersResponse] = await Promise.all([
        supabase.from('notes').select('*').order('updated_at', { ascending: false }),
        supabase.from('folders').select('*').order('name'),
      ]);

      if (notesResponse.error) throw notesResponse.error;
      if (foldersResponse.error) throw foldersResponse.error;

      setNotes(notesResponse.data || []);
      setFolders(foldersResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados. Tente novamente.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Create note
  const createNote = async (title: string, folderId?: string, content?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title,
          content: content || '',
          folder_id: folderId || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setCurrentNote(data);
      
      toast({
        title: "Sucesso",
        description: `Nota "${title}" criada com sucesso.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar nota. Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update note
  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => note.id === id ? data : note));
      
      if (currentNote?.id === id) {
        setCurrentNote(data);
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar nota. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Delete note
  const deleteNote = async (id: string) => {
    if (!user) return;

    try {
      // First get the note to check if it exists
      const { data: noteData, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching note for deletion:', fetchError);
        throw fetchError;
      }

      if (!noteData) {
        throw new Error('Nota não encontrada');
      }

      // Delete the note
      const { error: deleteError } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting note:', deleteError);
        throw deleteError;
      }

      // Update local state
      setNotes(prev => prev.filter(note => note.id !== id));
      
      if (currentNote?.id === id) {
        setCurrentNote(null);
      }

      toast({
        title: "Sucesso",
        description: "Nota excluída com sucesso.",
      });
    } catch (error) {
      console.error('Error in deleteNote:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir nota. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Create folder
  const createFolder = async (name: string, parentId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name,
          parent_folder_id: parentId || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [...prev, data]);
      
      toast({
        title: "Sucesso",
        description: `Pasta "${name}" criada com sucesso.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pasta. Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete folder
  const deleteFolder = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFolders(prev => prev.filter(folder => folder.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Pasta excluída com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir pasta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Find note by title (for wikilinks)
  const findNoteByTitle = (title: string) => {
    return notes.find(note => note.title.toLowerCase() === title.toLowerCase());
  };

  // Get backlinks for a note
  const getBacklinks = (noteTitle: string) => {
    const pattern = new RegExp(`\\[\\[${noteTitle}\\]\\]`, 'gi');
    return notes.filter(note => pattern.test(note.content));
  };

  // Get links from a note
  const getLinksFromNote = (content: string) => {
    const pattern = /\[\[([^\]]+)\]\]/g;
    const links = [];
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    return links;
  };

  return {
    notes,
    folders,
    currentNote,
    loading,
    setCurrentNote,
    createNote,
    updateNote,
    deleteNote,
    createFolder,
    deleteFolder,
    findNoteByTitle,
    getBacklinks,
    getLinksFromNote,
    loadData,
  };
};