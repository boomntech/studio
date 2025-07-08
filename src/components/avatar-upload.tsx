
'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface AvatarUploadProps {
  onFileChange: (file: File | null) => void;
  initialImageUrl?: string;
  fallbackText?: string;
}

export function AvatarUpload({ onFileChange, initialImageUrl, fallbackText = 'U' }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileChange(file);
    } else {
      onFileChange(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group w-32 h-32 cursor-pointer mx-auto" onClick={handleClick}>
      <Avatar className="w-32 h-32 border-4 border-card">
        <AvatarImage src={previewUrl || undefined} />
        <AvatarFallback className="text-4xl">{fallbackText}</AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="h-8 w-8 text-white" />
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
      />
    </div>
  );
}
