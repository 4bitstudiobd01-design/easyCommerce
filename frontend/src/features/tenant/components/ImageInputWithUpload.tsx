'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUploadStoreMediaMutation } from '@/features/tenant/api/tenantApi';

type StoreMediaFileableType = 'STORE_LOGO' | 'STORE_FAVICON' | 'STORE_BANNER';

interface ImageInputWithUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  description?: string;
  previewShape?: 'square' | 'rectangle' | 'banner' | 'icon';
  disabled?: boolean;
  fileableType?: StoreMediaFileableType;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export function ImageInputWithUpload({
  label,
  value = '',
  onChange,
  placeholder = 'https://example.com/image.png',
  description,
  previewShape = 'square',
  disabled = false,
  fileableType = 'STORE_LOGO',
}: ImageInputWithUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadMedia, { isLoading: isUploading }] = useUploadStoreMediaMutation();

  // Sync internal state when prop value changes
  React.useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  const handleFileUpload = async (files: FileList | null) => {
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
      const result = await uploadMedia({ file, fileableType }).unwrap();
      if (result?.url) {
        onChange(result.url);
        setUrlInput(result.url);
        toast.success(`${label} uploaded successfully!`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload image. Please try again.');
    }
  };

  const handleUrlSubmit = (newUrl: string) => {
    setUrlInput(newUrl);
    onChange(newUrl.trim());
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPreviewClasses = () => {
    switch (previewShape) {
      case 'icon':
        return 'w-14 h-14 rounded-xl';
      case 'square':
        return 'w-24 h-24 rounded-2xl';
      case 'banner':
        return 'w-full h-32 rounded-2xl';
      case 'rectangle':
      default:
        return 'w-36 h-24 rounded-2xl';
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">{label}</label>

        {/* Tab switcher: Upload vs URL */}
        <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              mode === 'upload'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              mode === 'url'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {description && (
        <p className="text-[11px] text-slate-500 font-medium -mt-1">{description}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={(e) => handleFileUpload(e.target.files)}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* If an image is already set */}
      {value ? (
        <div
          className={`p-3 bg-white border border-slate-200 rounded-2xl shadow-xs flex gap-4 ${
            previewShape === 'banner' ? 'flex-col' : 'items-center'
          }`}
        >
          <div
            className={`relative shrink-0 overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center ${getPreviewClasses()}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={`${label} Preview`}
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Image Active</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 truncate max-w-full">{value}</p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    const newUrl = prompt('Enter new Image URL:', value);
                    if (newUrl !== null) handleUrlSubmit(newUrl);
                  }
                }}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* When no image is selected */
        <div>
          {mode === 'upload' ? (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (!disabled) handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-700">Uploading {label}...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800">
                      <span className="text-blue-600 hover:underline">Choose file</span> or drag & drop
                    </p>
                    <p className="text-[10.5px] text-slate-400 font-medium">
                      PNG, JPG, WEBP, GIF, AVIF (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* URL Input Field */
            <div className="space-y-2">
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => handleUrlSubmit(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <p className="text-[10.5px] text-slate-400">
                Paste a direct image link from ImgBB, Cloudinary, or your hosted server.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
