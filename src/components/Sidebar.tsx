import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { useNotes, Note } from '@/hooks/useNotes';

interface SidebarProps {
  currentNote: Note | null;
  onNoteSelect: (note: Note) => void;
}

export const Sidebar = ({ currentNote, onNoteSelect }: SidebarProps) => {
  const { getBacklinks, getLinksFromNote, findNoteByTitle } = useNotes();

  if (!currentNote) {
    return (
      <div className="w-80 bg-sidebar border-l border-sidebar-border p-4">
        <div className="text-center text-muted-foreground">
          <LinkIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Selecione uma nota para ver os links e backlinks</p>
        </div>
      </div>
    );
  }

  const backlinks = getBacklinks(currentNote.title);
  const outgoingLinks = getLinksFromNote(currentNote.content);
  const linkedNotes = outgoingLinks
    .map(link => findNoteByTitle(link))
    .filter(Boolean) as Note[];

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Note Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Informações da Nota</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">
              <p>Criada: {new Date(currentNote.created_at).toLocaleDateString()}</p>
              <p>Modificada: {new Date(currentNote.updated_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Outgoing Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Links desta nota
              <Badge variant="secondary" className="text-xs">
                {outgoingLinks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outgoingLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum link encontrado</p>
            ) : (
              <div className="space-y-2">
                {outgoingLinks.map((link, index) => {
                  const linkedNote = findNoteByTitle(link);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{link}</span>
                      {linkedNote ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNoteSelect(linkedNote)}
                          className="h-6 px-2 text-xs"
                        >
                          Abrir
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Não existe
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backlinks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Links para esta nota
              <Badge variant="secondary" className="text-xs">
                {backlinks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {backlinks.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma nota faz referência a esta
              </p>
            ) : (
              <div className="space-y-2">
                {backlinks.map((note) => (
                  <div key={note.id} className="flex items-center justify-between">
                    <span className="text-sm truncate">{note.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNoteSelect(note)}
                      className="h-6 px-2 text-xs"
                    >
                      Abrir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">{currentNote.content.length}</div>
                <div className="text-muted-foreground">Caracteres</div>
              </div>
              <div className="text-center p-2 bg-muted rounded">
                <div className="font-medium">
                  {currentNote.content.split(/\s+/).filter(word => word.length > 0).length}
                </div>
                <div className="text-muted-foreground">Palavras</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};