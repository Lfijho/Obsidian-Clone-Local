import React, { useState, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Edit, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { useNotes, Note } from '@/hooks/useNotes';
import { useAuth } from '@/hooks/useAuth';
import { getImageUrl } from '@/lib/imageUtils';
import 'highlight.js/styles/github-dark.css';

interface MarkdownEditorProps {
  note: Note | null;
}

export const MarkdownEditor = ({ note }: MarkdownEditorProps) => {
  const { updateNote, createNote, findNoteByTitle } = useNotes();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setIsDirty(false);
      setLastSaved(new Date(note.updated_at));
    } else {
      setTitle('');
      setContent('');
      setIsDirty(false);
      setLastSaved(null);
    }
  }, [note]);

  // Auto-save functionality
  const saveNote = useCallback(async () => {
    if (!note || !isDirty) return;

    await updateNote(note.id, { 
      title: title.trim() || 'Nota sem título', 
      content 
    });
    setIsDirty(false);
    setLastSaved(new Date());
  }, [note, title, content, isDirty, updateNote]);

  // Save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveNote]);

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    if (!isDirty) return;

    const timer = setTimeout(saveNote, 2000);
    return () => clearTimeout(timer);
  }, [content, title, isDirty, saveNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  };

  // Handle wikilink clicks
  const handleWikilinkClick = async (linkText: string) => {
    const existingNote = findNoteByTitle(linkText);
    
    if (existingNote) {
      // Note exists, open it (this would be handled by parent component)
      console.log('Opening existing note:', existingNote.title);
    } else {
      // Note doesn't exist, create it
      const newNote = await createNote(linkText);
      if (newNote) {
        console.log('Created new note:', newNote.title);
      }
    }
  };

  // Render markdown with custom wikilink and image handling
  const components = {
    p: ({ children, ...props }: any) => {
      if (typeof children === 'string') {
        // Process wikilinks
        const parts = children.split(/(\[\[[^\]]+\]\])/g);
        const processedChildren = parts.map((part: string, index: number) => {
          const wikilinkMatch = part.match(/^\[\[([^\]]+)\]\]$/);
          if (wikilinkMatch) {
            const linkText = wikilinkMatch[1];
            const existingNote = findNoteByTitle(linkText);
            
            return (
              <span
                key={index}
                className={`cursor-pointer ${
                  existingNote 
                    ? 'text-wikilink hover:text-wikilink-hover underline' 
                    : 'text-wikilink-new hover:text-wikilink-hover underline decoration-dashed'
                }`}
                onClick={() => handleWikilinkClick(linkText)}
                title={existingNote ? 'Abrir nota existente' : 'Criar nova nota'}
              >
                {linkText}
              </span>
            );
          }
          return part;
        });
        
        return <p {...props}>{processedChildren}</p>;
      }
      return <p {...props}>{children}</p>;
    },
    img: ({ src, alt, ...props }: any) => {
      // If it's not already a full URL and we have a user, convert to Supabase URL
      if (user && src && !src.startsWith('http')) {
        const fileName = src.split('/').pop() || src;
        const imageUrl = getImageUrl(user.id, fileName);
        return <img {...props} src={imageUrl} alt={alt} className="max-w-full h-auto rounded-md" />;
      }
      return <img {...props} src={src} alt={alt} className="max-w-full h-auto rounded-md" />;
    },
  };

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center bg-editor-background text-editor-foreground">
        <div className="text-center">
          <Edit className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma nota selecionada</h3>
          <p className="text-muted-foreground">
            Selecione uma nota na barra lateral ou crie uma nova
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-editor-background">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={handleTitleChange}
            className="text-lg font-medium border-none shadow-none p-0 h-auto bg-transparent"
            placeholder="Título da nota..."
          />
          <div className="flex items-center gap-2">
            {isDirty && (
              <Button onClick={saveNote} size="sm" variant="outline">
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            )}
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                Salvo {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="edit" className="h-full">
          <div className="border-b border-border">
            <TabsList className="h-9">
              <TabsTrigger value="edit" className="text-xs">
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Visualizar
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="edit" className="h-full m-0 p-4">
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Digite seu conteúdo em Markdown aqui...

Dicas:
- Use [[Nome da Nota]] para criar links entre notas
- Use # para títulos
- Use **texto** para negrito
- Use *texto* para itálico
- Use ```código``` para blocos de código"
              className="h-full resize-none border-none shadow-none bg-editor-background text-editor-foreground font-mono text-sm leading-relaxed"
            />
          </TabsContent>
          
          <TabsContent value="preview" className="h-full m-0 p-4 overflow-y-auto">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
              >
                {content || '_Nenhum conteúdo para visualizar_'}
              </ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};