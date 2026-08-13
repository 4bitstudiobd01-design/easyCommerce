'use client';

import React, { useState, useRef } from 'react';
import {
  ProductImage,
  useGetProductMediaQuery,
  useUploadProductMediaMutation,
  useAddProductMediaMutation,
  useSetPrimaryMediaMutation,
  useReorderProductMediaMutation,
  useDeleteProductMediaMutation,
} from '../api/catalogApi';
import { Image as ImageIcon, Star, Trash2, ChevronLeft, ChevronRight, Plus, UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductMediaGalleryProps {
  productId?: string;
  localImages?: { url: string; altText?: string; isPrimary?: boolean }[];
  onLocalImagesChange?: (images: { url: string; altText?: string; isPrimary?: boolean }[]) => void;
}

export function ProductMediaGallery({
  productId,
  localImages = [],
  onLocalImagesChange,
}: ProductMediaGalleryProps) {
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showInputForm, setShowInputForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMedia, { isLoading: isUploading }] = useUploadProductMediaMutation();

  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];


  // RTK Query endpoints if editing existing product
  const { data: remoteImages = [], isLoading: isFetchingMedia } = useGetProductMediaQuery(
    productId || '',
    { skip: !productId },
  );

  const [addMedia, { isLoading: isAdding }] = useAddProductMediaMutation();
  const [setPrimary, { isLoading: isSettingPrimary }] = useSetPrimaryMediaMutation();
  const [reorderMedia, { isLoading: isReordering }] = useReorderProductMediaMutation();
  const [deleteMedia, { isLoading: isDeleting }] = useDeleteProductMediaMutation();

  const isRemote = Boolean(productId);

  /**
   * Uploads picked/dropped files, then registers the returned URLs.
   *
   * Files are validated here as well as on the server so an oversized or unsupported
   * file is reported immediately instead of after a wasted round trip.
   */
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const rejected: string[] = [];
    const accepted = files.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} (unsupported type)`);
        return false;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB, max 5MB)`);
        return false;
      }
      return true;
    });

    if (rejected.length > 0) {
      toast.error(`Skipped ${rejected.length} file(s): ${rejected.join(', ')}`);
    }
    if (accepted.length === 0) return;

    try {
      const uploaded = await uploadMedia({ files: accepted, productId }).unwrap();

      if (isRemote && productId) {
        // Existing product: attach each uploaded file to the gallery.
        for (const item of uploaded) {
          await addMedia({ productId, url: item.url }).unwrap();
        }
      } else if (onLocalImagesChange) {
        // New product: hold the URLs until the product itself is saved.
        const startedEmpty = localImages.length === 0;
        onLocalImagesChange([
          ...localImages,
          ...uploaded.map((item, idx) => ({
            url: item.url,
            isPrimary: startedEmpty && idx === 0,
          })),
        ]);
      }

      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload images. Please try again.');
    } finally {
      // Allow re-selecting the same file after a failure.
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  // Normalize list for display
  const displayImages: { id?: string; url: string; altText?: string; isPrimary: boolean }[] = isRemote
    ? remoteImages.map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary,
      }))
    : localImages.map((img, index) => ({
        id: `local-${index}`,
        url: img.url,
        altText: img.altText,
        isPrimary: Boolean(img.isPrimary || index === 0),
      }));

  const handleAddImage = async (urlToAdd?: string) => {
    const targetUrl = (urlToAdd || imageUrlInput).trim();
    if (!targetUrl) return;

    if (isRemote && productId) {
      try {
        await addMedia({ productId, url: targetUrl }).unwrap();
        toast.success('Image added to gallery');
        setImageUrlInput('');
        setShowInputForm(false);
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to add image');
      }
    } else if (onLocalImagesChange) {
      const isFirst = localImages.length === 0;
      const updated = [
        ...localImages,
        { url: targetUrl, isPrimary: isFirst },
      ];
      onLocalImagesChange(updated);
      setImageUrlInput('');
      setShowInputForm(false);
      toast.success('Image added');
    }
  };

  const handleSetPrimary = async (index: number, imageId?: string) => {
    if (isRemote && productId && imageId) {
      try {
        await setPrimary({ productId, mediaId: imageId }).unwrap();
        toast.success('Primary image updated');
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to set primary image');
      }
    } else if (onLocalImagesChange) {
      const updated = localImages.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
      onLocalImagesChange(updated);
      toast.success('Primary image updated');
    }
  };

  const handleMove = async (index: number, direction: 'LEFT' | 'RIGHT') => {
    const targetIndex = direction === 'LEFT' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= displayImages.length) return;

    if (isRemote && productId) {
      const newOrderedList = [...remoteImages];
      const [moved] = newOrderedList.splice(index, 1);
      newOrderedList.splice(targetIndex, 0, moved);

      try {
        await reorderMedia({
          productId,
          mediaIds: newOrderedList.map((img) => img.id),
        }).unwrap();
        toast.success('Gallery reordered');
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to reorder images');
      }
    } else if (onLocalImagesChange) {
      const newLocal = [...localImages];
      const [moved] = newLocal.splice(index, 1);
      newLocal.splice(targetIndex, 0, moved);
      onLocalImagesChange(newLocal);
    }
  };

  const handleDelete = async (index: number, imageId?: string) => {
    if (isRemote && productId && imageId) {
      try {
        await deleteMedia({ productId, mediaId: imageId }).unwrap();
        toast.success('Image removed');
      } catch (err: any) {
        toast.error(err?.data?.message || 'Failed to remove image');
      }
    } else if (onLocalImagesChange) {
      const updated = localImages.filter((_, i) => i !== index);
      // Promote first item if deleted item was primary
      if (updated.length > 0 && !updated.some((img) => img.isPrimary)) {
        updated[0].isPrimary = true;
      }
      onLocalImagesChange(updated);
      toast.success('Image removed');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>Product Media & Gallery</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add images, drag/reorder gallery, and choose your primary product cover photo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5" />
            )}
            <span>{isUploading ? 'Uploading…' : 'Upload Images'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInputForm(!showInputForm)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add URL</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        multiple
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
        aria-label="Upload product images"
      />

      {/* Input URL Dropzone Form */}
      {showInputForm && (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-slate-700">Image Web URL</label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/photo-1521572267360-ee0c2909d518"
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => handleAddImage()}
              disabled={isAdding || !imageUrlInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isFetchingMedia && (
        <div className="py-8 text-center text-xs text-slate-400 font-medium">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
          Loading gallery images...
        </div>
      )}

      {/* Empty State Dropzone */}
      {!isFetchingMedia && displayImages.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2 group ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
          }`}
        >
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>
          <p className="text-xs font-bold text-slate-800">
            {isUploading ? 'Uploading images…' : 'Drag & drop images here, or click to upload'}
          </p>
          <p className="text-[11px] text-slate-400">
            JPG, PNG, WEBP, GIF or AVIF — up to 5MB each, 10 files at a time
          </p>
        </div>
      )}

      {/* Image Grid — also accepts dropped files so more can be added without scrolling up */}
      {!isFetchingMedia && displayImages.length > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 rounded-2xl transition-all ${
            isDragging ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-white' : ''
          }`}
        >
          {displayImages.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`group relative rounded-xl border overflow-hidden bg-slate-100 transition-all ${
                img.isPrimary ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' : 'border-slate-200'
              }`}
            >
              {/* Image Preview */}
              <div className="aspect-square w-full overflow-hidden bg-slate-50 flex items-center justify-center">
                <img
                  src={img.url}
                  alt={img.altText || `Product image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Primary Badge */}
              {img.isPrimary && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  Primary
                </span>
              )}

              {/* Hover Actions Toolbar */}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                {/* Set Primary Button */}
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx, img.id)}
                    disabled={isSettingPrimary}
                    className="p-2 bg-white/90 hover:bg-white text-slate-800 hover:text-amber-500 rounded-lg shadow transition-colors"
                    title="Set as Primary cover image"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Move Left */}
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'LEFT')}
                    disabled={isReordering}
                    className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow transition-colors"
                    title="Move image left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Move Right */}
                {idx < displayImages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'RIGHT')}
                    disabled={isReordering}
                    className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow transition-colors"
                    title="Move image right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(idx, img.id)}
                  disabled={isDeleting}
                  className="p-2 bg-white/90 hover:bg-rose-50 text-rose-600 rounded-lg shadow transition-colors"
                  title="Remove image from gallery"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
