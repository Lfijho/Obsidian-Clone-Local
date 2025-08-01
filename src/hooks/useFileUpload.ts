import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotes } from './useNotes';
import { toast } from '@/hooks/use-toast';

export const useFileUpload = () => {
  const { user } = useAuth();
  const { createNote } = useNotes();
  const [uploading, setUploading] = useState(false);

  const uploadMarkdownFile = async (file: File) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer upload de arquivos.",
        variant: "destructive",
      });
      return;
    }

    if (!file.name.endsWith('.md')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos .md são suportados.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Ler o conteúdo do arquivo
      const fileContent = await file.text();
      
      // Extrair o título do nome do arquivo (removendo .md)
      const title = file.name.replace('.md', '');

      // Fazer upload do arquivo para o storage
      const filePath = `${user.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('markdown-files')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Criar uma nova nota com o conteúdo do arquivo
      await createNote(title, undefined, fileContent);

      toast({
        title: "Sucesso",
        description: `Arquivo "${file.name}" importado com sucesso.`,
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo. Tente novamente.",
        variant: "destructive",
      });
    }

    setUploading(false);
  };

  const uploadMultipleFiles = async (files: File[]) => {
    for (const file of files) {
      await uploadMarkdownFile(file);
    }
  };

  return {
    uploadMarkdownFile,
    uploadMultipleFiles,
    uploading,
  };
};