import { LayoutDashboard, Building2, ShoppingCart, Database, Globe, LucideIcon } from 'lucide-react';

export interface AdminRouteItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badgeCountKey?: string;
  requiredPermissions: string[];
}

export const ADMIN_ROUTES: AdminRouteItem[] = [
  {
    id: 'overview',
    label: 'Platform Overview',
    href: '/admin',
    icon: LayoutDashboard,
    requiredPermissions: [],
  },
  {
    id: 'stores',
    label: 'Merchant Stores',
    href: '/admin/stores',
    icon: Building2,
    requiredPermissions: ['admin.stores.read'],
  },
  {
    id: 'orders',
    label: 'System Purchases',
    href: '/admin/orders',
    icon: ShoppingCart,
    requiredPermissions: ['admin.orders.read'],
  },
  {
    id: 'settings',
    label: 'Infrastructure & DB',
    href: '/admin/settings',
    icon: Database,
    requiredPermissions: ['admin.infrastructure.read'],
  },
  {
    id: 'cms',
    label: 'Landing Page CMS',
    href: '/admin/cms',
    icon: Globe,
    requiredPermissions: ['admin.cms.manage'],
  },
];
