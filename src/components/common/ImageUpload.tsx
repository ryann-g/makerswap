import React, { useState, useRef } from 'react';

// Removed firebase storage import as we are using base64 due to bucket non-existence
import { Button } from '@/components/ui/button';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  folder: 'listings' | 'bounties';
  currentImage?: string;
}

export function ImageUpload({ onUploadComplete, folder, currentImage }: ImageUploadProps) {
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleUpload = (file: File) => {
    if (!file.type.match('image/(jpeg|png|webp)')) {
      toast.error('Only JPEG, PNG, or WEBP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setProgress(40);
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        setProgress(80);
        // Compress heavily to fit within Firestore document limits
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
        
        if (dataUrl.length > 1000000) {
           toast.error('Image is too complex and exceeds storage limits. Try a simpler image.');
           setIsUploading(false);
           return;
        }

        setPreviewUrl(dataUrl);
        onUploadComplete(dataUrl);
        setProgress(100);
        setTimeout(() => setIsUploading(false), 500);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative rounded-md overflow-hidden border border-border h-48 bg-muted">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-colors cursor-pointer min-h-[12rem]",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
            isUploading && "pointer-events-none opacity-60"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
            autoComplete="off"
          />
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium mb-1">Click or drag image to upload</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
        </div>
      )}

      {isUploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-primary font-medium">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
