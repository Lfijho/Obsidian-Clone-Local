import { supabase } from '@/integrations/supabase/client';

/**
 * Gets the public URL for an image stored in Supabase Storage
 */
export const getImageUrl = (userId: string, fileName: string): string => {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(`${userId}/${fileName}`);
  
  return data.publicUrl;
};

/**
 * Extracts image references from markdown content
 */
export const extractImageReferences = (content: string): string[] => {
  const imageRegex = /!\[.*?\]\(([^)]+)\)/g;
  const matches: string[] = [];
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
};

/**
 * Updates markdown content with correct Supabase image URLs
 */
export const updateImageReferences = (content: string, userId: string): string => {
  return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
    // Skip if it's already a full URL
    if (path.startsWith('http')) {
      return match;
    }
    
    // Extract filename from path
    const fileName = path.split('/').pop() || path;
    const imageUrl = getImageUrl(userId, fileName);
    
    return `![${alt}](${imageUrl})`;
  });
};