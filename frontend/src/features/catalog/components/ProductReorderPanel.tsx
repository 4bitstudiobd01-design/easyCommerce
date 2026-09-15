'use client';

import React, { useEffect, useState } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Package,
  AlertCircle,
  Loader2,
  ListOrdered,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Product,
  HomepageSection,
  useGetProductsQuery,
  useReorderProductsMutation,
} from '@/features/catalog/api/catalogApi';

type SectionFilter = HomepageSection | 'ALL';

const SECTION_TABS: { value: SectionFilter; label: string }[] = [
  { value: 'HERO_FEATURED', label: 'Hero / Featured' },
  { value: 'NEW_ARRIVALS', label: 'New Arrivals' },
  { value: 'BEST_SELLERS', label: 'Best Sellers' },
  { value: 'ALL', label: 'All Products' },
];

interface ProductReorderPanelProps {
  onClose: () => void;
}

/**
 * Flat drag-to-reorder list for curated homepage placements. Scoped to a bounded
 * section rather than the full catalog: the main product table is server-paginated,
 * which is incompatible with a full-list drag reorder, and reordering only makes
 * practical sense within a small curated set anyway.
 *
 * Adapted from CategoryTreeTable's native HTML5 drag-and-drop pattern, minus the
 * tree-specific parent/child nesting — this is a flat list.
 */
export function ProductReorderPanel({ onClose }: ProductReorderPanelProps) {
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('HERO_FEATURED');

  const { data, isLoading, isError, refetch } = useGetProductsQuery({
    page: 1,
    limit: 100,
    section: sectionFilter === 'ALL' ? undefined : sectionFilter,
    sortBy: 'createdAt',
    sortOrder: 'ASC',
  });

  const [reorderProducts, { isLoading: isReordering }] = useReorderProductsMutation();

  const [items, setItems] = useState<Product[]>([]);

  // Sync from the server whenever the filter changes or fresh data arrives, but not
  // while a drag/drop is actively re-ordering local state (same pattern as the tree table).
  useEffect(() => {
    const fetched = data?.data || [];
    const sorted = [...fetched].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    setItems(sorted);
  }, [data]);

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'above' | 'below' } | null>(null);

  const persistOrder = async (ordered: Product[]) => {
    try {
      await reorderProducts({ productIds: ordered.map((p) => p.id) }).unwrap();
      toast.success('Product order updated.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update product order.');
      refetch();
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isReordering) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const position = relativeY < rect.height / 2 ? 'above' : 'below';
    setDropTarget({ id: targetId, position });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId || !dropTarget) {
      setDraggedId(null);
      setDropTarget(null);
      return;
    }

    const currentDraggedId = draggedId;
    const targetPos = dropTarget.position;
    setDraggedId(null);
    setDropTarget(null);

    const fromIndex = items.findIndex((p) => p.id === currentDraggedId);
    let targetIndex = items.findIndex((p) => p.id === targetId);
    if (fromIndex < 0 || targetIndex < 0) return;

    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    targetIndex = reordered.findIndex((p) => p.id === targetId);
    const insertIndex = targetPos === 'above' ? targetIndex : targetIndex + 1;
    reordered.splice(insertIndex, 0, moved);

    setItems(reordered);
    await persistOrder(reordered);
  };

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex((p) => p.id === id);
    if (index < 0) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const reordered = [...items];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    setItems(reordered);
    await persistOrder(reordered);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section Filter Tabs */}
      <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSectionFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sectionFilter === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Drag <GripVertical className="w-3 h-3 inline text-slate-400" /> to reorder, or use the arrows. Order only
          applies within this view — reordering only makes sense within a bounded set, not the full catalog.
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900">Failed to load products</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <ListOrdered className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No products in this view</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {sectionFilter === 'ALL'
                ? 'No products found.'
                : 'Tag products with this homepage section from the product form to see them here.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {items.map((product, index) => {
              const isDragged = draggedId === product.id;
              const isTarget = dropTarget?.id === product.id;
              const targetPosition = isTarget ? dropTarget.position : null;
              const image = product.images?.[0]?.url;

              return (
                <li
                  key={product.id}
                  onDragOver={(e) => handleDragOver(e, product.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, product.id)}
                  className={`relative flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                    isDragged ? 'opacity-40 bg-slate-100 border-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50/80'
                  } ${targetPosition ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                >
                  {targetPosition === 'above' && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                  )}
                  {targetPosition === 'below' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                  )}

                  <div
                    draggable={!isReordering}
                    onDragStart={(e) => handleDragStart(e, product.id)}
                    className={`p-1 text-slate-300 hover:text-slate-600 rounded transition-colors ${
                      isReordering ? 'cursor-not-allowed opacity-30' : 'cursor-grab active:cursor-grabbing hover:bg-slate-100'
                    }`}
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <span className="w-6 text-center text-[11px] font-bold text-slate-400">{index + 1}</span>

                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{product.name || product.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">/{product.slug}</p>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMove(product.id, 'up')}
                      disabled={index === 0 || isReordering}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move Up in Order"
                      aria-label={`Move ${product.name || product.title} up`}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(product.id, 'down')}
                      disabled={index === items.length - 1 || isReordering}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move Down in Order"
                      aria-label={`Move ${product.name || product.title} down`}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isReordering && (
        <div className="px-6 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Saving order…</span>
        </div>
      )}
    </div>
  );
}
