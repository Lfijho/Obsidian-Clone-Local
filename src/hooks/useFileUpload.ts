import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotes } from './useNotes';
import { toast } from '@/hooks/use-toast';
import { extractImageReferences, updateImageReferences } from '@/lib/imageUtils';

export const useFileUpload = () => {
  const { user } = useAuth();
  const { createNote, createFolder, folders } = useNotes();
  const [uploading, setUploading] = useState(false);

  const createFolderFromPath = async (folderPath: string, parentId?: string): Promise<string> => {
    const folderName = folderPath.split('/').pop() || folderPath;
    
    // Check if folder already exists
    const existingFolder = folders.find(f => 
      f.name === folderName && f.parent_folder_id === parentId
    );
    
    if (existingFolder) {
      return existingFolder.id;
    }

    // Create new folder
    const newFolder = await createFolder(folderName, parentId);
    return newFolder.id;
  };

  const uploadImageFile = async (file: File, targetFolderId?: string) => {
    if (!user) {
      return { success: false, fileName: file.name, error: 'User not authenticated' };
    }

    const isImage = /\.(png|jpe?g)$/i.test(file.name);
    if (!isImage) {
      return { success: false, fileName: file.name, error: 'Invalid image format' };
    }

    try {
      // Upload image to storage
      const filePath = `${user.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      return { success: true, fileName: file.name, isImage: true };

    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, fileName: file.name, error, isImage: true };
    }
  };

  const uploadMarkdownFile = async (file: File, targetFolderId?: string, availableImages?: Set<string>) => {
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

    try {
      // Ler o conteúdo do arquivo
      let fileContent = await file.text();
      
      // Se temos imagens disponíveis, atualizar as referências no markdown
      if (availableImages && availableImages.size > 0) {
        fileContent = updateImageReferences(fileContent, user.id);
      }
      
      // Extrair o título do nome do arquivo (removendo .md)
      const title = file.name.replace('.md', '');

      // Fazer upload do arquivo para o storage
      const filePath = `${user.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('markdown-files')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Criar uma nova nota com o conteúdo atualizado
      await createNote(title, targetFolderId, fileContent);

      return { success: true, fileName: file.name };

    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, fileName: file.name, error };
    }
  };

  const uploadMultipleFiles = async (files: File[]) => {
    setUploading(true);
    
    try {
      const results = [];
      const folderMap = new Map<string, string>(); // path -> folderId
      
      // Process files to understand folder structure
      const filesByFolder = new Map<string, File[]>();
      
      for (const file of files) {
        // Get the folder path from the file's webkitRelativePath or path
        const relativePath = (file as any).webkitRelativePath || file.name;
        const folderPath = relativePath.split('/').slice(0, -1).join('/');
        
        if (!filesByFolder.has(folderPath)) {
          filesByFolder.set(folderPath, []);
        }
        filesByFolder.get(folderPath)!.push(file);
      }
      
      // Create folders first, in order from parent to child
      const folderPaths = Array.from(filesByFolder.keys()).sort();
      
      for (const folderPath of folderPaths) {
        if (folderPath) { // Skip root level
          const pathParts = folderPath.split('/');
          let currentParentId: string | undefined;
          
          for (let i = 0; i < pathParts.length; i++) {
            const currentPath = pathParts.slice(0, i + 1).join('/');
            
            if (!folderMap.has(currentPath)) {
              const folderId = await createFolderFromPath(pathParts[i], currentParentId);
              folderMap.set(currentPath, folderId);
            }
            
            currentParentId = folderMap.get(currentPath);
          }
        }
      }
      
      // First, upload all images
      const uploadedImages = new Set<string>();
      
      for (const [folderPath, folderFiles] of filesByFolder.entries()) {
        const targetFolderId = folderPath ? folderMap.get(folderPath) : undefined;
        
        for (const file of folderFiles) {
          if (/\.(png|jpe?g)$/i.test(file.name)) {
            const result = await uploadImageFile(file, targetFolderId);
            results.push(result);
            
            if (result?.success) {
              uploadedImages.add(file.name);
            }
          }
        }
      }
      
      // Then, upload markdown files with updated image references
      for (const [folderPath, folderFiles] of filesByFolder.entries()) {
        const targetFolderId = folderPath ? folderMap.get(folderPath) : undefined;
        
        for (const file of folderFiles) {
          if (file.name.endsWith('.md')) {
            const result = await uploadMarkdownFile(file, targetFolderId, uploadedImages);
            results.push(result);
          } else if (!/\.(png|jpe?g)$/i.test(file.name)) {
            // Handle other unsupported file types
            results.push({ success: false, fileName: file.name, error: 'Unsupported file type' });
          }
        }
      }
      
      // Show summary toast
      const successful = results.filter(r => r?.success).length;
      const failed = results.filter(r => r && !r.success).length;
      
      if (successful > 0) {
        toast({
          title: "Importação concluída",
          description: `${successful} arquivo(s) importado(s) com sucesso${failed > 0 ? `, ${failed} falharam` : ''}.`,
        });
      }
      
      if (failed > 0 && successful === 0) {
        toast({
          title: "Erro na importação",
          description: `Falha ao importar ${failed} arquivo(s).`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar arquivos. Tente novamente.",
        variant: "destructive",
      });
    }
    
    setUploading(false);
  };

  return {
    uploadMarkdownFile,
    uploadMultipleFiles,
    uploading,
  };
};