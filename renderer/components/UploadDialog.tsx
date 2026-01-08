import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadMedia } from '../utils/mediaLibraryUtils';
import { toast } from 'sonner';
import { Loader2, Sparkles, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploadComplete: () => void;
}

interface UploadProgress {
  filename: string;
  status: 'pending' | 'optimizing' | 'uploading' | 'complete' | 'error';
  isImage: boolean;
  progress: number;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ isOpen, onOpenChange, onUploadComplete }) => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const handleUpload = async () => {
    if (!files) return;
    setIsUploading(true);
    
    // Initialize progress tracking
    const fileArray = Array.from(files);
    const initialProgress: UploadProgress[] = fileArray.map(f => ({
      filename: f.name,
      status: 'pending',
      isImage: f.type.startsWith('image/'),
      progress: 0
    }));
    setUploadProgress(initialProgress);
    
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const isImage = file.type.startsWith('image/');
        
        // Update status to optimizing for images
        if (isImage) {
          setUploadProgress(prev => prev.map((p, idx) => 
            idx === i ? { ...p, status: 'optimizing', progress: 25 } : p
          ));
          toast.info(`🎨 Optimizing ${file.name}...`, { duration: 1500 });
        } else {
          setUploadProgress(prev => prev.map((p, idx) => 
            idx === i ? { ...p, status: 'uploading', progress: 50 } : p
          ));
        }
        
        // Simulate progress increase
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => prev.map((p, idx) => {
            if (idx === i && p.progress < 75) {
              return { ...p, progress: p.progress + 15 };
            }
            return p;
          }));
        }, 300);
        
        // Upload the file
        await uploadMedia(file, {});
        
        clearInterval(progressInterval);
        
        // Mark as complete
        setUploadProgress(prev => prev.map((p, idx) => 
          idx === i ? { ...p, status: 'complete', progress: 100 } : p
        ));
        
        if (isImage) {
          toast.success(`✨ ${file.name} optimized & uploaded!`, { duration: 2000 });
        }
      }
      
      toast.success(`🎉 All ${fileArray.length} file(s) uploaded successfully!`);
      onUploadComplete();
      
      // Close after a brief delay to show completion
      setTimeout(() => {
        onOpenChange(false);
        setUploadProgress([]);
      }, 1500);
    } catch (error) {
      toast.error('Upload failed.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isUploading) {
        onOpenChange(open);
        if (!open) setUploadProgress([]);
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Upload Media
          </DialogTitle>
          <DialogDescription>
            {isUploading ? (
              <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4 animate-pulse" />
                Images will be automatically optimized to WebP format
              </span>
            ) : (
              'Select files to upload to your library. Images are optimized automatically.'
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input 
            type="file" 
            multiple 
            onChange={(e) => setFiles(e.target.files)} 
            disabled={isUploading}
            accept="image/*,video/*"
          />
          
          {/* Progress Display */}
          {uploadProgress.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uploadProgress.map((item, idx) => (
                <div key={idx} className="space-y-2 p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate flex-1 pr-2">
                      {item.filename}
                    </span>
                    {item.status === 'complete' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : item.status === 'optimizing' ? (
                      <Sparkles className="h-4 w-4 text-blue-500 animate-pulse flex-shrink-0" />
                    ) : item.status === 'uploading' ? (
                      <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
                    ) : null}
                  </div>
                  
                  {item.status === 'optimizing' && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                      <Sparkles className="h-3 w-3" />
                      <span>Converting to WebP & generating variants...</span>
                    </div>
                  )}
                  
                  {item.status === 'complete' && item.isImage && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        ✓ Optimized
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                        WebP
                      </span>
                    </div>
                  )}
                  
                  <Progress value={item.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!files || isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
