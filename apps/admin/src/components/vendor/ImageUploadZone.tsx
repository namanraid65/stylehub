import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, ImagePlus, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageUploadZoneProps {
  images:    string[];         // Current image URLs
  onChange:  (urls: string[]) => void;
  maxImages?: number;
  label?:    string;
  aspect?:   'square' | 'banner';  // square = 1:1 products, banner = 3:1
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  images,
  onChange,
  maxImages = 8,
  label = 'Product Images',
  aspect = 'square',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);

  // In production this would upload to Cloudinary.
  // For now we generate a local object URL as preview.
  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = maxImages - images.length;
      const toProcess = Array.from(files).slice(0, remaining);

      toProcess.forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          onChange([...images, url]);
        };
        reader.readAsDataURL(file);
      });
    },
    [images, maxImages, onChange],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const canAdd = images.length < maxImages;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>

      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((url, idx) => (
            <div
              key={idx}
              className={cn(
                'group relative overflow-hidden rounded-lg border-2 border-border bg-muted',
                aspect === 'banner' ? 'col-span-4 aspect-[3/1]' : 'aspect-square',
                idx === 0 && 'border-primary/60 ring-1 ring-primary/30',
              )}
            >
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="h-full w-full object-cover"
                onClick={() => setPreviewing(url)}
              />
              {/* Main badge */}
              {idx === 0 && (
                <span className="absolute bottom-1 left-1 rounded text-[9px] font-bold bg-primary text-white px-1">
                  MAIN
                </span>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className={cn(
                  'absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full',
                  'bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity',
                )}
              >
                <X className="h-3 w-3" />
              </button>
              {/* Drag handle */}
              <div className="absolute left-1 top-1 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAdd && (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer',
            'transition-all duration-200 p-8',
            dragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/50',
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            {dragging ? (
              <Upload className="h-5 w-5 text-primary animate-bounce" />
            ) : (
              <ImagePlus className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {dragging ? 'Drop to upload' : 'Click or drag & drop images'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PNG, JPG, WebP · Max {maxImages} images · {images.length}/{maxImages} uploaded
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => processFiles(e.target.files)}
          />
        </div>
      )}

      {/* Lightbox preview */}
      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewing(null)}
        >
          <img src={previewing} alt="Preview" className="max-h-[80vh] max-w-[80vw] rounded-xl object-contain" />
          <button
            onClick={() => setPreviewing(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;
