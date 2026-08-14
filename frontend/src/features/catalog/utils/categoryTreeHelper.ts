import { CategoryListItem, CategoryTreeNode } from '../api/catalogApi';

export interface FormattedCategoryOption {
  id: string;
  name: string;
  displayName: string;
  path: string;
  level: number;
}

/**
 * Builds a hierarchical list of category options with visual tree indentation
 * and breadcrumb paths for selects and dropdowns.
 */
export function formatHierarchicalCategoryOptions(
  categories: (CategoryListItem | CategoryTreeNode | { id: string; name: string; parentId?: string | null; sortOrder?: number })[],
): FormattedCategoryOption[] {
  if (!categories || categories.length === 0) return [];

  const childrenMap = new Map<string, any[]>();
  const roots: any[] = [];
  const allMap = new Map<string, any>();

  categories.forEach((cat) => {
    allMap.set(cat.id, cat);
    if (!cat.parentId) {
      roots.push(cat);
    } else {
      const list = childrenMap.get(cat.parentId) || [];
      list.push(cat);
      childrenMap.set(cat.parentId, list);
    }
  });

  const result: FormattedCategoryOption[] = [];

  function traverse(cat: any, level: number, parentPath: string) {
    const currentPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
    const prefix = level === 0 ? '' : '— '.repeat(level) + '└ ';
    result.push({
      id: cat.id,
      name: cat.name,
      displayName: `${prefix}${cat.name}`,
      path: currentPath,
      level,
    });

    const children = childrenMap.get(cat.id) || [];
    children.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
    children.forEach((child) => traverse(child, level + 1, currentPath));
  }

  roots.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  roots.forEach((root) => traverse(root, 0, ''));

  // Collect any disconnected/orphan categories
  categories.forEach((cat) => {
    if (!result.some((r) => r.id === cat.id)) {
      result.push({
        id: cat.id,
        name: cat.name,
        displayName: cat.name,
        path: cat.name,
        level: 0,
      });
    }
  });

  return result;
}
