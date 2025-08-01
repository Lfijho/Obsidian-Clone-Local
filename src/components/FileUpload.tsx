import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

export const FileUpload = () => {
  const { uploadMultipleFiles, uploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
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

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        disabled={uploading}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? 'Importando...' : 'Importar .md'}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};