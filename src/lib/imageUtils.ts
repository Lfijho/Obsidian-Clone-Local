import { supabase } from '@/integrations/supabase/client';

/**
 * Gets the public URL for an image stored in Supabase Storage
 */
export const getImageUrl = (userId: string, fileName: string): string => {
  try {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(`${userId}/${fileName}`);
    
    console.log('Generated image URL:', data.publicUrl, 'for file:', fileName);
    return data.publicUrl;
  } catch (error) {
    console.error('Error generating image URL:', error);
    return '';
  }
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
  console.log('Updating image references for user:', userId);
  console.log('Original content:', content);
  
  const updatedContent = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
    console.log('Found image reference:', match, 'alt:', alt, 'path:', path);
    
    // Skip if it's already a full URL
    if (path.startsWith('http')) {
      console.log('Skipping - already a full URL');
      return match;
    }
    
    // Extract filename from path (handle both relative paths and just filenames)
    const fileName = path.split('/').pop() || path;
    const imageUrl = getImageUrl(userId, fileName);
    
    const newMatch = `![${alt}](${imageUrl})`;
    console.log('Updated image reference:', newMatch);
    return newMatch;
  });
  
  console.log('Updated content:', updatedContent);
  return updatedContent;
};