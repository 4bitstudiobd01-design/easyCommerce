'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, UploadCloud, Loader2, X, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadCategoryMediaMutation } from '../api/catalogApi';

interface CategoryImageUploadProps {
  imageUrl?: string | null;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export function CategoryImageUpload({
  imageUrl,
  onImageChange,
  disabled = false,
}: CategoryImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMedia, { isLoading: isUploading }] = useUploadCategoryMediaMutation();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    const file = files[0];
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Unsupported file type. Please upload JPG, PNG, WEBP, GIF, or AVIF.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast.error(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed size is 5MB.`);
      return;
    }

    try {
      const results = await uploadMedia({ files: [file] }).unwrap();
      if (results && results.length > 0) {
        onImageChange(results[0].url);
        toast.success('Category image uploaded successfully.');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload image. Please try again.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || isUploading}
        className="hidden"
        id="category-image-input"
        aria-label="Upload Category Image"
      />

      {imageUrl ? (
        /* Image Preview Card */
        <div className="relative group rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs">
          <div className="aspect-video w-full relative flex items-center justify-center bg-slate-900/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Category Banner Preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-xs font-semibold text-slate-700">Uploading...</span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone Upload */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-700">Uploading category banner...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-[11px] text-slate-400">
                  JPG, PNG, WEBP, GIF, AVIF (Max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
