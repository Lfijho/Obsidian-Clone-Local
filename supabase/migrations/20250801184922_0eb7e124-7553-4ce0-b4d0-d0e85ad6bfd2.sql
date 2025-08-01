-- Create storage bucket for user markdown files
INSERT INTO storage.buckets (id, name, public) VALUES ('markdown-files', 'markdown-files', false);

-- Create policies for markdown files storage
CREATE POLICY "Users can view their own markdown files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'markdown-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own markdown files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'markdown-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own markdown files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'markdown-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own markdown files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'markdown-files' AND auth.uid()::text = (storage.foldername(name))[1]);