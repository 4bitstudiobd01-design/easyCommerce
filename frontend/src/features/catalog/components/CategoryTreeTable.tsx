'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FolderTree,
  Folder,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Package,
  ExternalLink,
  Edit,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowLeftToLine,
  MoreVertical,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CategoryTreeNode,
  CategoryStatus,
  useReorderCategoryMutation,
} from '../api/catalogApi';

interface CategoryTreeTableProps {
  tree: CategoryTreeNode[];
  isLoading: boolean;
  isError: boolean;
  refetchTree: () => void;
  searchTerm?: string;
  statusFilter?: CategoryStatus | 'ALL';
  selectedIds: Set<string>;
  onSelectRow: (id: string) => void;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface FlattenedTreeItem {
  node: CategoryTreeNode;
  depth: number;
  hasChildren: boolean;
  isLastChild: boolean;
  parentPath: string[];
}

export function CategoryTreeTable({
  tree,
  isLoading,
  isError,
  refetchTree,
  searchTerm = '',
  statusFilter = 'ALL',
  selectedIds,
  onSelectRow,
  onSelectAll,
}: CategoryTreeTableProps) {
  const [reorderCategory, { isLoading: isReordering }] = useReorderCategoryMutation();

  // Expand / Collapse State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Expand top-level and first-level categories by default
    const initial = new Set<string>();
    tree.forEach((root) => {
      initial.add(root.id);
      root.children?.forEach((child) => initial.add(child.id));
    });
    return initial;
  });

  // Action Menu open state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    id: string;
    position: 'above' | 'below' | 'inside';
  } | null>(null);

  const isFiltered = Boolean(searchTerm.trim()) || statusFilter !== 'ALL';

  // Toggle single expand
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper to collect all node IDs
  const collectAllIds = useCallback((nodes: CategoryTreeNode[]): string[] => {
    let ids: string[] = [];
    nodes.forEach((n) => {
      ids.push(n.id);
      if (n.children && n.children.length > 0) {
        ids = ids.concat(collectAllIds(n.children));
      }
    });
    return ids;
  }, []);

  const handleExpandAll = () => {
    const all = collectAllIds(tree);
    setExpandedIds(new Set(all));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  // Helper: check if `potentialDescendantId` is a descendant of `ancestorId`
  const isDescendant = useCallback(
    (ancestorId: string, potentialDescendantId: string, nodes: CategoryTreeNode[]): boolean => {
      const findNode = (id: string, list: CategoryTreeNode[]): CategoryTreeNode | null => {
        for (const item of list) {
          if (item.id === id) return item;
          if (item.children && item.children.length > 0) {
            const found = findNode(id, item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const ancestorNode = findNode(ancestorId, nodes);
      if (!ancestorNode || !ancestorNode.children) return false;

      const checkInTree = (n: CategoryTreeNode): boolean => {
        if (n.id === potentialDescendantId) return true;
        return (n.children || []).some((c) => checkInTree(c));
      };

      return checkInTree(ancestorNode);
    },
    [],
  );

  // Flatten tree for clean rendering based on expanded state and filters
  const flattenedRows = useMemo(() => {
    const rows: FlattenedTreeItem[] = [];

    const matchesFilter = (n: CategoryTreeNode): boolean => {
      if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const selfMatches =
          n.name.toLowerCase().includes(term) || n.slug.toLowerCase().includes(term);
        const childMatches = (n.children || []).some((c) => matchesFilter(c));
        return selfMatches || childMatches;
      }
      return true;
    };

    const traverse = (
      nodes: CategoryTreeNode[],
      depth: number,
      parentPath: string[],
    ) => {
      nodes.forEach((node, index) => {
        if (isFiltered && !matchesFilter(node)) {
          return;
        }

        const hasChildren = Boolean(node.children && node.children.length > 0);
        const isLastChild = index === nodes.length - 1;

        rows.push({
          node,
          depth,
          hasChildren,
          isLastChild,
          parentPath,
        });

        const isExpanded = isFiltered || expandedIds.has(node.id);
        if (hasChildren && isExpanded) {
          traverse(node.children, depth + 1, [...parentPath, node.name]);
        }
      });
    };

    traverse(tree, 0, []);
    return rows;
  }, [tree, expandedIds, searchTerm, statusFilter, isFiltered]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isFiltered || isReordering) {
      e.preventDefault();
      return;
    }
    setDraggedNodeId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === targetId) {
      return;
    }

    // Prevent dragging an ancestor into its own descendant
    if (isDescendant(draggedNodeId, targetId, tree)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const height = rect.height;

    // Split row into top 30% (above), middle 40% (inside/nest), bottom 30% (below)
    if (relativeY < height * 0.3) {
      setDropTarget({ id: targetId, position: 'above' });
    } else if (relativeY > height * 0.7) {
      setDropTarget({ id: targetId, position: 'below' });
    } else {
      setDropTarget({ id: targetId, position: 'inside' });
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === targetId || !dropTarget) {
      setDraggedNodeId(null);
      setDropTarget(null);
      return;
    }

    if (isDescendant(draggedNodeId, targetId, tree)) {
      toast.error('Cannot move a category into one of its own descendants.');
      setDraggedNodeId(null);
      setDropTarget(null);
      return;
    }

    const currentDraggedId = draggedNodeId;
    const targetPos = dropTarget.position;
    setDraggedNodeId(null);
    setDropTarget(null);

    // Find nodes in tree
    const findNodeAndSiblings = (
      id: string,
      nodes: CategoryTreeNode[],
      parent: CategoryTreeNode | null = null,
    ): { node: CategoryTreeNode; siblings: CategoryTreeNode[]; parent: CategoryTreeNode | null } | null => {
      for (const item of nodes) {
        if (item.id === id) {
          return { node: item, siblings: nodes, parent };
        }
        if (item.children && item.children.length > 0) {
          const found = findNodeAndSiblings(id, item.children, item);
          if (found) return found;
        }
      }
      return null;
    };

    const targetInfo = findNodeAndSiblings(targetId, tree);
    if (!targetInfo) return;

    try {
      if (targetPos === 'inside') {
        // Move as a child of targetId
        await reorderCategory({
          categoryId: currentDraggedId,
          newParentId: targetId,
          newSortOrder: 0,
        }).unwrap();
        // Automatically expand the parent node
        setExpandedIds((prev) => new Set([...Array.from(prev), targetId]));
      } else {
        // Move as sibling above/below targetId
        const newParentId = targetInfo.parent ? targetInfo.parent.id : null;
        const targetIndex = targetInfo.siblings.findIndex((s) => s.id === targetId);
        const insertIndex = targetPos === 'above' ? targetIndex : targetIndex + 1;

        await reorderCategory({
          categoryId: currentDraggedId,
          newParentId,
          newSortOrder: insertIndex,
        }).unwrap();
      }

      toast.success('Category hierarchy updated.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update category order.');
      refetchTree();
    }
  };

  // Keyboard / Action Menu Movement helpers
  const handleMoveSibling = async (node: CategoryTreeNode, direction: 'up' | 'down') => {
    setOpenMenuId(null);
    const parentId = node.parentId || null;

    // Find siblings
    const findSiblings = (pId: string | null, nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
      if (!pId) return nodes;
      for (const item of nodes) {
        if (item.id === pId) return item.children || [];
        if (item.children && item.children.length > 0) {
          const found = findSiblings(pId, item.children);
          if (found.length > 0) return found;
        }
      }
      return [];
    };

    const siblings = findSiblings(parentId, tree);
    const currentIndex = siblings.findIndex((s) => s.id === node.id);
    if (currentIndex < 0) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= siblings.length) return;

    try {
      await reorderCategory({
        categoryId: node.id,
        newParentId: parentId,
        newSortOrder: newIndex,
      }).unwrap();
      toast.success('Category order updated.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reorder category.');
    }
  };

  const handleMoveToRoot = async (node: CategoryTreeNode) => {
    setOpenMenuId(null);
    try {
      await reorderCategory({
        categoryId: node.id,
        newParentId: null,
        newSortOrder: tree.length,
      }).unwrap();
      toast.success(`Moved "${node.name}" to Root level.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to move category to root.');
    }
  };

  const renderStatusBadge = (status: CategoryStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            Draft
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
            Archived
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(dateString);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Top Tree Controls Toolbar */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Hierarchy View</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 font-medium">
            {flattenedRows.length} categories shown
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isFiltered ? (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Search active: Drag & drop paused
            </span>
          ) : (
            <span className="hidden sm:inline text-[11px] text-slate-400">
              Drag <GripVertical className="w-3.5 h-3.5 inline text-slate-400" /> to reorder or nest
            </span>
          )}

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Main Hierarchical Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={
                    flattenedRows.length > 0 &&
                    flattenedRows.every((r) => selectedIds.has(r.node.id))
                  }
                  onChange={onSelectAll}
                  aria-label="Select all categories on tree"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3">Hierarchy & Category</th>
              <th className="px-4 py-3 text-center">Products</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3.5 text-center">
                    <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-40 bg-slate-200 rounded" />
                        <div className="h-2.5 w-24 bg-slate-100 rounded" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="h-5 w-10 bg-slate-200 rounded-full mx-auto" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-5 w-16 bg-slate-200 rounded-md" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="h-3.5 w-20 bg-slate-200 rounded" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="h-7 w-7 bg-slate-200 rounded-lg ml-auto" />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-900">Failed to load category hierarchy</p>
                  <p className="text-xs text-slate-400">Please check your store connection and try again.</p>
                  <button
                    type="button"
                    onClick={() => refetchTree()}
                    className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ) : flattenedRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">No categories found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Create categories to start building your store hierarchy tree.
                    </p>
                    <Link
                      href="/dashboard/categories/create"
                      className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Category</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ) : (
              flattenedRows.map(({ node, depth, hasChildren }) => {
                const isSelected = selectedIds.has(node.id);
                const isExpanded = isFiltered || expandedIds.has(node.id);
                const isCurrentlyDragged = draggedNodeId === node.id;
                const isTarget = dropTarget?.id === node.id;
                const targetPosition = isTarget ? dropTarget.position : null;

                return (
                  <tr
                    key={node.id}
                    onDragOver={(e) => handleDragOver(e, node.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, node.id)}
                    className={`relative transition-all ${
                      isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                    } ${isCurrentlyDragged ? 'opacity-40 bg-slate-100' : ''} ${
                      targetPosition === 'inside'
                        ? 'bg-blue-100/60 ring-2 ring-blue-500 ring-inset'
                        : ''
                    }`}
                  >
                    {/* Top / Bottom Drop Indicator Line */}
                    {targetPosition === 'above' && (
                      <td colSpan={6} className="p-0">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 z-10 shadow-xs" />
                      </td>
                    )}
                    {targetPosition === 'below' && (
                      <td colSpan={6} className="p-0">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 z-10 shadow-xs" />
                      </td>
                    )}

                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(node.id)}
                        aria-label={`Select ${node.name}`}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Hierarchy Indentation, Drag Handle, Expand/Collapse & Name */}
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${depth * 24}px` }}
                      >
                        {/* Drag Handle */}
                        <div
                          draggable={!isFiltered && !isReordering}
                          onDragStart={(e) => handleDragStart(e, node.id)}
                          className={`p-1 text-slate-300 hover:text-slate-600 rounded transition-colors ${
                            isFiltered
                              ? 'cursor-not-allowed opacity-30'
                              : 'cursor-grab active:cursor-grabbing hover:bg-slate-100'
                          }`}
                          title={
                            isFiltered
                              ? 'Drag & drop disabled during search'
                              : 'Drag to reorder or nest category'
                          }
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Expand / Collapse Control */}
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(node.id, e)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 transition-transform"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-6" />
                        )}

                        {/* Folder Icon */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            depth === 0
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          }`}
                        >
                          {depth === 0 ? (
                            <FolderTree className="w-3.5 h-3.5" />
                          ) : (
                            <Folder className="w-3.5 h-3.5" />
                          )}
                        </div>

                        {/* Name & Slug */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/categories/${node.id}`}
                              className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors truncate"
                            >
                              {node.name}
                            </Link>
                            {node.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-bold">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono">/{node.slug}</span>
                            {hasChildren && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 font-medium">
                                  {node.children.length} subcategories
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Products Count */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          node.productsCount > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Package className="w-3 h-3 text-slate-400" />
                        <span>{node.productsCount}</span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      {renderStatusBadge(node.status)}
                    </td>

                    {/* Updated Date */}
                    <td className="px-4 py-3 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                      {formatDate(node.updatedAt || node.createdAt)}
                    </td>

                    {/* Action Menu & Keyboard Movement Dropdown */}
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-flex items-center gap-1">
                        <Link
                          href={`/dashboard/categories/${node.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <Link
                          href={`/dashboard/categories/${node.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Category"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Action Dropdown Toggle */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === node.id ? null : node.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="More Hierarchy Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu Popup */}
                        {openMenuId === node.id && (
                          <div
                            onMouseLeave={() => setOpenMenuId(null)}
                            className="absolute right-0 top-8 z-30 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-left text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              type="button"
                              onClick={() => handleMoveSibling(node, 'up')}
                              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium text-left"
                            >
                              <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                              <span>Move Up in Sibling Order</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveSibling(node, 'down')}
                              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium text-left"
                            >
                              <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                              <span>Move Down in Sibling Order</span>
                            </button>

                            {node.parentId && (
                              <button
                                type="button"
                                onClick={() => handleMoveToRoot(node)}
                                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-medium text-left border-t border-slate-100"
                              >
                                <ArrowLeftToLine className="w-3.5 h-3.5 text-slate-400" />
                                <span>Move to Root Level</span>
                              </button>
                            )}

                            <Link
                              href={`/dashboard/categories/create`}
                              className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 text-blue-600 font-bold text-left border-t border-slate-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Subcategory</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
