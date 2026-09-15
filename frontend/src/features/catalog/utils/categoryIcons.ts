import {
  Folder,
  Tag,
  Shirt,
  ShoppingBag,
  Briefcase,
  Watch,
  Ticket,
  Sparkles,
  Footprints,
  Gift,
  Home,
  Camera,
  type LucideIcon,
} from 'lucide-react';

/**
 * The single source of truth for the category icon picker. A category stores its
 * choice as the `id` string; anything that renders a category resolves it back to a
 * component with `getCategoryIcon`. Previously this list was duplicated in the
 * create and edit views and never used anywhere else, so list/detail rows always
 * showed a hard-coded folder.
 */
export interface CategoryIconOption {
  id: string;
  name: string;
  icon: LucideIcon;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'folder', name: 'Folder', icon: Folder },
  { id: 'tag', name: 'Tag', icon: Tag },
  { id: 'shirt', name: 'Shirt', icon: Shirt },
  { id: 'shopping-bag', name: 'Jacket', icon: ShoppingBag },
  { id: 'briefcase', name: 'Briefcase', icon: Briefcase },
  { id: 'watch', name: 'Watch', icon: Watch },
  { id: 'ticket', name: 'Ticket', icon: Ticket },
  { id: 'sparkles', name: 'Sparkles', icon: Sparkles },
  { id: 'footprints', name: 'Shoes', icon: Footprints },
  { id: 'gift', name: 'Gift', icon: Gift },
  { id: 'home', name: 'Home', icon: Home },
  { id: 'camera', name: 'Camera', icon: Camera },
];

const ICON_BY_ID = new Map<string, LucideIcon>(
  CATEGORY_ICON_OPTIONS.map((option) => [option.id, option.icon]),
);

/** Resolves a stored icon id to its component, falling back to Folder. */
export function getCategoryIcon(iconId?: string | null): LucideIcon {
  return (iconId && ICON_BY_ID.get(iconId)) || Folder;
}
