'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadFileMutation, FileableType, FileType } from '@/features/upload/api/uploadApi';

type PreviewShape = 'square' | 'banner';

interface FileUploadProps {
  /** Current file URL (empty string / null when nothing is set). */
  value?: string | null;
  /** Called with the hosted URL after a successful upload, or null on remove. */
  onChange: (url: string | null) => void;
  label?: string;
  description?: string;
  /** Storage bucket / folder on the backend. */
  fileableType?: FileableType;
  fileType?: FileType;
  /** Owning record id, when it already exists. */
  fileableId?: string;
  accept?: string;
  maxSizeMB?: number;
  /** 'square' = a fixed thumbnail card; 'banner' = full-width strip. */
  previewShape?: PreviewShape;
  disabled?: boolean;
}

const DEFAULT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

/**
 * Reusable file picker. The parent only ever holds the returned URL — the raw file
 * never travels inside a JSON body, so record-create requests stay small and rows
 * do not carry base64 blobs.
 */
export function FileUpload({
  value,
  onChange,
  label,
  description,
  fileableType = 'GENERAL',
  fileType = 'IMAGE',
  fileableId,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 5,
  previewShape = 'square',
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

  const acceptedTypes = accept.split(',').map((t) => t.trim()).filter(Boolean);
  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    const file = files[0];

    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      toast.error('Unsupported file type.');
      return;
    }
    if (file.size > maxBytes) {
      toast.error(
        `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed size is ${maxSizeMB}MB.`,
      );
      return;
    }

    try {
      const result = await uploadFile({ file, fileableType, fileType, fileableId }).unwrap();
      onChange(result.url);
      toast.success('File uploaded.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload file. Please try again.');
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-xs font-bold text-slate-800">{label}</label>}
      {description && <p className="text-[11px] text-slate-500 font-medium">{description}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        previewShape === 'banner' ? (
          <div className="w-full space-y-2.5">
            <div className="relative w-full h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={label ? `${label} preview` : 'Uploaded file preview'}
                className="w-full h-full object-cover"
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
            <div className="flex items-center gap-2">
              <ReplaceRemoveButtons
                onReplace={() => inputRef.current?.click()}
                onRemove={handleRemove}
                disabled={disabled || isUploading}
              />
            </div>
          </div>
        ) : (
          <div className="inline-flex flex-col gap-2 w-40">
            <div className="relative w-40 h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={label ? `${label} preview` : 'Uploaded file preview'}
                className="w-full h-full object-cover"
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
            <div className="flex items-center gap-1.5">
              <ReplaceRemoveButtons
                onReplace={() => inputRef.current?.click()}
                onRemove={handleRemove}
                disabled={disabled || isUploading}
              />
            </div>
          </div>
        )
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!disabled) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => !disabled && !isUploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-700">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-1.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  <span className="text-blue-600 hover:underline">Choose file</span> or drag &amp; drop
                </p>
                <p className="text-[10.5px] text-slate-400 font-medium">
                  PNG, JPG, WEBP, GIF, AVIF (Max {maxSizeMB}MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReplaceRemoveButtons({
  onReplace,
  onRemove,
  disabled,
}: {
  onReplace: () => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onReplace}
        disabled={disabled}
        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Replace</span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50"
      >
        <X className="w-3 h-3" />
        <span>Remove</span>
      </button>
    </>
  );
}
