import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FolderOpen } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

export const FileUpload = () => {
  const { uploadMultipleFiles, uploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFolderSelect = () => {
    folderInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      await uploadMultipleFiles(fileArray);
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFolderChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      await uploadMultipleFiles(fileArray);
      
      // Reset the input
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        disabled={uploading}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? 'Importando...' : 'Arquivos .md e imagens'}
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleFolderSelect}
        disabled={uploading}
        className="flex items-center gap-2"
      >
        <FolderOpen className="h-4 w-4" />
        {uploading ? 'Importando...' : 'Pasta'}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.png,.jpg,.jpeg"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      <input
        ref={folderInputRef}
        type="file"
        accept=".md,.png,.jpg,.jpeg"
        /* @ts-ignore */
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderChange}
        className="hidden"
      />
    </div>
  );
};