'use client';

import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StoreSwitcherDropdown } from '@/features/tenant/components/StoreSwitcherDropdown';
import { useGetMerchantOrderKpisQuery } from '@/features/order/api/orderApi';
import { useGetRequisitionStatsQuery } from '@/features/finance/api/financeApi';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  UserCheck,
  Truck,
  Settings,
  Store as StoreIcon,
  Layers,
  Megaphone,
  BarChart2,
  MonitorSmartphone,
  ShoppingBag,
  Target,
  Activity,
  BarChart3,
  MessageSquare,
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  Building2,
  CalendarCheck,
  CalendarRange,
  PartyPopper,
  Clock3,
  Receipt,
  Wallet,
  UserCircle2,
  ChevronDown,
  Landmark,
  TrendingUp,
  TrendingDown,
  Scale,
  FileText,
  ArrowLeftRight,
  Home,
  BookOpen,
  ClipboardCheck,
  Banknote,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  isDesktopCollapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

export const Sidebar = ({
  isMobileOpen = false,
  isDesktopCollapsed = false,
  onClose,
  onToggleCollapse,
}: SidebarProps) => {
  const pathname = usePathname();

  const { data: orderKpis } = useGetMerchantOrderKpisQuery();
  const pendingOrdersCount = orderKpis?.pendingConfirmation ?? (orderKpis?.statusCounts?.PENDING ?? 0);

  const { data: reqStats } = useGetRequisitionStatsQuery(undefined, {
    pollingInterval: 30000,
  });
  const pendingRequisitionsCount = reqStats?.pendingCount ?? 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path === '/dashboard/accounting' && pathname === '/dashboard/accounting') return true;
    if (path === '/dashboard/purchase' && pathname === '/dashboard/purchase') return true;
    if (path === '/dashboard/finance/overview' && (pathname === '/dashboard/finance' || pathname === '/dashboard/finance/overview')) return true;
    if (path !== '/dashboard' && path !== '/dashboard/accounting' && path !== '/dashboard/purchase' && pathname.startsWith(path)) return true;
    return false;
  };

  const isRouteInGroup = (prefix: string | string[]) => {
    if (Array.isArray(prefix)) return prefix.some(p => pathname.startsWith(p));
    return pathname.startsWith(prefix);
  };

  // Collapsible Accordion Groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    ecommerce: true,
    purchase: isRouteInGroup('/dashboard/purchase'),
    crm: isRouteInGroup('/dashboard/crm'),
    hrm: isRouteInGroup('/dashboard/hr'),
    accounting: isRouteInGroup('/dashboard/accounting'),
    marketing: isRouteInGroup(['/dashboard/marketing', '/dashboard/analytics']),
  });

  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>({
    transactions: isRouteInGroup('/dashboard/accounting/transactions'),
    accounts: isRouteInGroup('/dashboard/accounting/accounts'),
    reports: isRouteInGroup('/dashboard/accounting/reports'),
    accountingSettings: isRouteInGroup('/dashboard/accounting/settings'),
  });

  const toggleSubGroup = (subKey: string) => {
    setOpenSubGroups(prev => ({ ...prev, [subKey]: !prev[subKey] }));
  };

  // Auto-expand active group when route changes
  useEffect(() => {
    if (isRouteInGroup(['/dashboard/orders', '/dashboard/products', '/dashboard/categories', '/dashboard/customers', '/dashboard/inventory', '/dashboard/logistics', '/dashboard/abandoned-carts', '/dashboard/themes'])) {
      setOpenGroups(prev => ({ ...prev, ecommerce: true }));
    }
    if (isRouteInGroup('/dashboard/purchase')) {
      setOpenGroups(prev => ({ ...prev, purchase: true }));
    }
    if (isRouteInGroup('/dashboard/crm')) {
      setOpenGroups(prev => ({ ...prev, crm: true }));
    }
    if (isRouteInGroup('/dashboard/hr')) {
      setOpenGroups(prev => ({ ...prev, hrm: true }));
    }
    if (isRouteInGroup('/dashboard/accounting')) {
      setOpenGroups(prev => ({ ...prev, accounting: true }));
    }
    if (isRouteInGroup('/dashboard/accounting/transactions')) {
      setOpenSubGroups(prev => ({ ...prev, transactions: true }));
    }
    if (isRouteInGroup('/dashboard/accounting/accounts')) {
      setOpenSubGroups(prev => ({ ...prev, accounts: true }));
    }
    if (isRouteInGroup('/dashboard/accounting/reports')) {
      setOpenSubGroups(prev => ({ ...prev, reports: true }));
    }
    if (isRouteInGroup('/dashboard/accounting/settings')) {
      setOpenSubGroups(prev => ({ ...prev, accountingSettings: true }));
    }
    if (isRouteInGroup(['/dashboard/marketing', '/dashboard/analytics'])) {
      setOpenGroups(prev => ({ ...prev, marketing: true }));
    }
  }, [pathname]);

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const [tooltipData, setTooltipData] = useState<{
    show: boolean;
    label: string;
    badge?: string;
    top: number;
    left: number;
  }>({ show: false, label: '', top: 0, left: 0 });

  const handleTooltipEnter = (e: React.MouseEvent | React.FocusEvent, label: string, badge?: string) => {
    if (!isDesktopCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipData({
      show: true,
      label,
      badge,
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const handleTooltipLeave = () => {
    setTooltipData(prev => ({ ...prev, show: false }));
  };

  const navItemClass = (path: string) => {
    const active = isActive(path);
    const baseClasses = `flex items-center transition-colors group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`;
    const sizeClasses = isDesktopCollapsed 
      ? 'w-11 h-11 justify-center mx-auto' 
      : 'w-full px-3 py-2 justify-between';
    const activeClasses = active
      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/20'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium';
    return `${baseClasses} ${sizeClasses} ${activeClasses}`;
  };

  const iconClass = isDesktopCollapsed ? "w-5 h-5 shrink-0" : "w-4 h-4 shrink-0";
  const iconStroke = isDesktopCollapsed ? 1.75 : 2;

  const AccordionHeader = ({
    title,
    groupKey,
    isOpen,
    count,
  }: {
    title: string;
    groupKey: string;
    isOpen: boolean;
    count?: number;
  }) => {
    if (isDesktopCollapsed) {
      return <div className="h-px bg-slate-800/80 my-2 mx-3" />;
    }
    return (
      <button
        type="button"
        onClick={() => toggleGroup(groupKey)}
        className="w-full flex items-center justify-between px-3 py-1.5 mt-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-white hover:text-white rounded-lg hover:bg-slate-800/40 transition-colors group"
      >
        <span className="flex items-center gap-1.5">
          <span>{title}</span>
          {count !== undefined && count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white leading-none shadow-xs animate-pulse">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-300' : ''
          }`}
        />
      </button>
    );
  };

  const subNavItemClass = (path: string) => {
    const active = isActive(path);
    const baseClasses = `flex items-center gap-2 px-3 py-1.5 transition-colors group rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-[12.5px]`;
    const activeClasses = active
      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/20'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium';
    return `${baseClasses} ${activeClasses}`;
  };

  const SubAccordion = ({
    title,
    icon: SubIcon,
    subKey,
    isOpen,
    routes,
    items,
  }: {
    title: string;
    icon: React.ElementType;
    subKey: string;
    isOpen: boolean;
    routes: string[];
    items: { label: string; href: string }[];
  }) => {
    const isGroupActive = routes.some(r => pathname.startsWith(r));

    if (isDesktopCollapsed) {
      return (
        <Link
          href={items[0]?.href || '/dashboard/accounting'}
          className={navItemClass(items[0]?.href || '')}
          onMouseEnter={(e) => handleTooltipEnter(e, title)}
          onFocus={(e) => handleTooltipEnter(e, title)}
          onMouseLeave={handleTooltipLeave}
          onBlur={handleTooltipLeave}
        >
          <div className="flex items-center gap-2.5">
            <SubIcon className={iconClass} strokeWidth={iconStroke} />
          </div>
        </Link>
      );
    }

    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleSubGroup(subKey)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
            isGroupActive
              ? 'text-white font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 font-medium'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <SubIcon className={iconClass} strokeWidth={iconStroke} />
            <span>{title}</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-white' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="pl-6 pr-1 space-y-0.5 mt-0.5">
            {items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={subNavItemClass(item.href)}
                  onMouseEnter={(e) => handleTooltipEnter(e, `${title}: ${item.label}`)}
                  onFocus={(e) => handleTooltipEnter(e, `${title}: ${item.label}`)}
                  onMouseLeave={handleTooltipLeave}
                  onBlur={handleTooltipLeave}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      active ? 'bg-white shadow-sm' : 'bg-slate-500'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-[#0F172A] text-slate-300 flex flex-col shrink-0 transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
          ${isDesktopCollapsed ? 'md:w-[72px]' : 'md:w-64'}
        `}
      >
        {/* Brand Header */}
        <div className={`p-4 flex items-center ${isDesktopCollapsed ? 'justify-center px-0' : 'justify-between'} border-b border-slate-800/60`}>
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/20">
              <StoreIcon className="w-4 h-4" />
            </div>
            {!isDesktopCollapsed && (
              <div className="min-w-0 truncate">
                <span className="font-extrabold text-sm text-white tracking-tight block leading-none truncate">
                  BitCommerce
                </span>
                <span className="text-[10px] text-blue-400 font-semibold mt-1 block leading-none">
                  Merchant Admin
                </span>
              </div>
            )}
          </Link>

          {/* Minimize button in expanded header */}
          {!isDesktopCollapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Minimize sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 text-[13px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600/80 overflow-x-hidden">
          
          {/* Main Dashboard */}
          {!isDesktopCollapsed && (
            <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Overview
            </div>
          )}
          <Link 
            href="/dashboard" 
            className={navItemClass('/dashboard')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Dashboard")}
            onFocus={(e) => handleTooltipEnter(e, "Dashboard")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Dashboard</span>}
            </div>
          </Link>

          {/* 1. E-COMMERCE ACCORDION */}
          <AccordionHeader 
            title="E-Commerce" 
            groupKey="ecommerce" 
            isOpen={openGroups.ecommerce}
            count={pendingOrdersCount > 0 ? pendingOrdersCount : undefined}
          />
          {(isDesktopCollapsed || openGroups.ecommerce) && (
            <div className="space-y-0.5">
              <Link 
                href="/dashboard/orders" 
                className={navItemClass('/dashboard/orders')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Orders", pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined)}
                onFocus={(e) => handleTooltipEnter(e, "Orders", pendingOrdersCount > 0 ? String(pendingOrdersCount) : undefined)}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Orders</span>}
                </div>
                {!isDesktopCollapsed && pendingOrdersCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                    isActive('/dashboard/orders')
                      ? 'bg-white text-blue-600 font-extrabold'
                      : 'bg-blue-600 text-white'
                  }`}>
                    {pendingOrdersCount}
                  </span>
                )}
              </Link>
              <Link 
                href="/dashboard/products" 
                className={navItemClass('/dashboard/products')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Products")}
                onFocus={(e) => handleTooltipEnter(e, "Products")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Package className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Products</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/categories" 
                className={navItemClass('/dashboard/categories')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Categories")}
                onFocus={(e) => handleTooltipEnter(e, "Categories")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <FolderTree className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Categories</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/customers" 
                className={navItemClass('/dashboard/customers')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Customers")}
                onFocus={(e) => handleTooltipEnter(e, "Customers")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Customers</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/inventory"
                className={navItemClass('/dashboard/inventory')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Inventory")}
                onFocus={(e) => handleTooltipEnter(e, "Inventory")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Inventory</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/logistics" 
                className={navItemClass('/dashboard/logistics')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Courier")}
                onFocus={(e) => handleTooltipEnter(e, "Courier")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Truck className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Courier</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/abandoned-carts"
                className={navItemClass('/dashboard/abandoned-carts')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Abandoned Carts")}
                onFocus={(e) => handleTooltipEnter(e, "Abandoned Carts")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Abandoned Carts</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/themes"
                className={navItemClass('/dashboard/themes')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Storefront Themes")}
                onFocus={(e) => handleTooltipEnter(e, "Storefront Themes")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <MonitorSmartphone className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Storefront Themes</span>}
                </div>
              </Link>
            </div>
          )}

          {/* 2. PURCHASE ACCORDION */}
          <AccordionHeader 
            title="Purchase" 
            groupKey="purchase" 
            isOpen={openGroups.purchase} 
          />
          {(isDesktopCollapsed || openGroups.purchase) && (
            <div className="space-y-0.5">
              <Link 
                href="/dashboard/purchase" 
                className={navItemClass('/dashboard/purchase')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Overview")}
                onFocus={(e) => handleTooltipEnter(e, "Overview")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Overview</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/purchase/suppliers" 
                className={navItemClass('/dashboard/purchase/suppliers')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Suppliers")}
                onFocus={(e) => handleTooltipEnter(e, "Suppliers")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Suppliers</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/purchase/purchase-orders" 
                className={navItemClass('/dashboard/purchase/purchase-orders')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Purchase Orders")}
                onFocus={(e) => handleTooltipEnter(e, "Purchase Orders")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Purchase Orders</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/purchase/purchases" 
                className={navItemClass('/dashboard/purchase/purchases')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Purchases")}
                onFocus={(e) => handleTooltipEnter(e, "Purchases")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Purchases</span>}
                </div>
              </Link>
            </div>
          )}

          {/* 3. CRM & OMNICHANNEL ACCORDION */}
          <AccordionHeader 
            title="CRM & Growth" 
            groupKey="crm" 
            isOpen={openGroups.crm} 
          />
          {(isDesktopCollapsed || openGroups.crm) && (
            <div className="space-y-0.5">
              <Link 
                href="/dashboard/crm/customers" 
                className={navItemClass('/dashboard/crm/customers')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Customers 360")}
                onFocus={(e) => handleTooltipEnter(e, "Customers 360")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Users className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Customers 360</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/crm/leads" 
                className={navItemClass('/dashboard/crm/leads')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Leads Pipeline")}
                onFocus={(e) => handleTooltipEnter(e, "Leads Pipeline")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Target className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Leads Pipeline</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/crm/chat" 
                className={navItemClass('/dashboard/crm/chat')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Omnichannel Chat")}
                onFocus={(e) => handleTooltipEnter(e, "Omnichannel Chat")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquare className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Omnichannel Chat</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/crm/channels" 
                className={navItemClass('/dashboard/crm/channels')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Channel Credentials")}
                onFocus={(e) => handleTooltipEnter(e, "Channel Credentials")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <KeyRound className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Channel Credentials</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/crm/segments" 
                className={navItemClass('/dashboard/crm/segments')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Customer Segments")}
                onFocus={(e) => handleTooltipEnter(e, "Customer Segments")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Customer Segments</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/crm/activities" 
                className={navItemClass('/dashboard/crm/activities')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Activity Hub")}
                onFocus={(e) => handleTooltipEnter(e, "Activity Hub")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Activity Hub</span>}
                </div>
              </Link>
              <Link 
                href="/dashboard/crm/analytics" 
                className={navItemClass('/dashboard/crm/analytics')}
                onMouseEnter={(e) => handleTooltipEnter(e, "CRM Analytics")}
                onFocus={(e) => handleTooltipEnter(e, "CRM Analytics")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>CRM Analytics</span>}
                </div>
              </Link>
            </div>
          )}

          {/* 4. HUMAN RESOURCES ACCORDION */}
          <AccordionHeader 
            title="Human Resources" 
            groupKey="hrm" 
            isOpen={openGroups.hrm} 
          />
          {(isDesktopCollapsed || openGroups.hrm) && (
            <div className="space-y-0.5">
              <Link
                href="/dashboard/hr/my-leave"
                className={navItemClass('/dashboard/hr/my-leave')}
                onMouseEnter={(e) => handleTooltipEnter(e, "My Leave")}
                onFocus={(e) => handleTooltipEnter(e, "My Leave")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <UserCircle2 className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>My Leave (ESS)</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/employees"
                className={navItemClass('/dashboard/hr/employees')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Employees")}
                onFocus={(e) => handleTooltipEnter(e, "Employees")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <UserCog className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Employees</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/departments"
                className={navItemClass('/dashboard/hr/departments')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Departments")}
                onFocus={(e) => handleTooltipEnter(e, "Departments")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Departments</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/attendance"
                className={navItemClass('/dashboard/hr/attendance')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Attendance")}
                onFocus={(e) => handleTooltipEnter(e, "Attendance")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarCheck className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Attendance</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/leave"
                className={navItemClass('/dashboard/hr/leave')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Leave Requests")}
                onFocus={(e) => handleTooltipEnter(e, "Leave Requests")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <CalendarRange className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Leave Requests</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/holidays"
                className={navItemClass('/dashboard/hr/holidays')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Holidays")}
                onFocus={(e) => handleTooltipEnter(e, "Holidays")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <PartyPopper className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Holidays</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/shifts"
                className={navItemClass('/dashboard/hr/shifts')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Shifts & Roster")}
                onFocus={(e) => handleTooltipEnter(e, "Shifts & Roster")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Clock3 className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Shifts & Roster</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/expenses"
                className={navItemClass('/dashboard/hr/expenses')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Employee Expenses")}
                onFocus={(e) => handleTooltipEnter(e, "Employee Expenses")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Employee Expenses</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/payroll"
                className={navItemClass('/dashboard/hr/payroll')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Payroll")}
                onFocus={(e) => handleTooltipEnter(e, "Payroll")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Payroll</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/notices"
                className={navItemClass('/dashboard/hr/notices')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Notice Board")}
                onFocus={(e) => handleTooltipEnter(e, "Notice Board")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Megaphone className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Notice Board</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/hr/reports"
                className={navItemClass('/dashboard/hr/reports')}
                onMouseEnter={(e) => handleTooltipEnter(e, "HR Reports")}
                onFocus={(e) => handleTooltipEnter(e, "HR Reports")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>HR Reports</span>}
                </div>
              </Link>
            </div>
          )}

          {/* 4. FINANCE (Single Route in Sidebar; all tabs accessible via upper navigation bar) */}
          <Link 
            href="/dashboard/finance/overview" 
            className={navItemClass('/dashboard/finance')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Finance", pendingRequisitionsCount > 0 ? String(pendingRequisitionsCount) : undefined)}
            onFocus={(e) => handleTooltipEnter(e, "Finance", pendingRequisitionsCount > 0 ? String(pendingRequisitionsCount) : undefined)}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="relative flex items-center gap-2.5">
              <Landmark className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Finance</span>}
              {isDesktopCollapsed && pendingRequisitionsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#0F172A] animate-pulse" />
              )}
            </div>
            {!isDesktopCollapsed && pendingRequisitionsCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold leading-none ${
                pathname.startsWith('/dashboard/finance')
                  ? 'bg-white text-rose-600'
                  : 'bg-rose-500 text-white animate-pulse'
              }`}>
                {pendingRequisitionsCount}
              </span>
            )}
          </Link>

          {/* 5. ACCOUNTING ACCORDION (Hidden from active navigation per simplified Finance MVP integration; code preserved for reuse) */}
          {/*
          <AccordionHeader 
            title="Accounting" 
            groupKey="accounting" 
            isOpen={openGroups.accounting} 
          />
          {(isDesktopCollapsed || openGroups.accounting) && (
            <div className="space-y-0.5">
              <Link
                href="/dashboard/accounting"
                className={navItemClass('/dashboard/accounting')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Overview")}
                onFocus={(e) => handleTooltipEnter(e, "Overview")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Home className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Overview</span>}
                </div>
              </Link>

              <SubAccordion
                title="Transactions"
                icon={FileText}
                subKey="transactions"
                isOpen={openSubGroups.transactions}
                routes={['/dashboard/accounting/transactions']}
                items={[
                  { label: 'Journal Entries', href: '/dashboard/accounting/transactions/journal-entries' },
                  { label: 'Expenses', href: '/dashboard/accounting/transactions/expenses' },
                ]}
              />

              <SubAccordion
                title="Accounts"
                icon={BookOpen}
                subKey="accounts"
                isOpen={openSubGroups.accounts}
                routes={['/dashboard/accounting/accounts']}
                items={[
                  { label: 'Chart of Accounts', href: '/dashboard/accounting/accounts/chart-of-accounts' },
                  { label: 'Ledger', href: '/dashboard/accounting/accounts/ledger' },
                ]}
              />

              <SubAccordion
                title="Reports"
                icon={BarChart3}
                subKey="reports"
                isOpen={openSubGroups.reports}
                routes={['/dashboard/accounting/reports']}
                items={[
                  { label: 'Profit & Loss', href: '/dashboard/accounting/reports/profit-loss' },
                  { label: 'Balance Sheet', href: '/dashboard/accounting/reports/balance-sheet' },
                ]}
              />

              <SubAccordion
                title="Settings"
                icon={Settings}
                subKey="accountingSettings"
                isOpen={openSubGroups.accountingSettings}
                routes={['/dashboard/accounting/settings']}
                items={[
                  { label: 'General', href: '/dashboard/accounting/settings/general' },
                  { label: 'Account Mapping', href: '/dashboard/accounting/settings/account-mapping' },
                  { label: 'Numbering', href: '/dashboard/accounting/settings/numbering' },
                ]}
              />
            </div>
          )}
          */}

          {/* 6. MARKETING & ANALYTICS ACCORDION */}
          <AccordionHeader 
            title="Marketing & Growth" 
            groupKey="marketing" 
            isOpen={openGroups.marketing} 
          />
          {(isDesktopCollapsed || openGroups.marketing) && (
            <div className="space-y-0.5">
              <Link 
                href="/dashboard/marketing" 
                className={navItemClass('/dashboard/marketing')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Marketing Pixels")}
                onFocus={(e) => handleTooltipEnter(e, "Marketing Pixels")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <Megaphone className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Marketing Pixels</span>}
                </div>
              </Link>
              <Link
                href="/dashboard/analytics"
                className={navItemClass('/dashboard/analytics')}
                onMouseEnter={(e) => handleTooltipEnter(e, "Store Analytics")}
                onFocus={(e) => handleTooltipEnter(e, "Store Analytics")}
                onMouseLeave={handleTooltipLeave}
                onBlur={handleTooltipLeave}
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2 className={iconClass} strokeWidth={iconStroke} />
                  {!isDesktopCollapsed && <span>Store Analytics</span>}
                </div>
              </Link>
            </div>
          )}

          {/* 7. STORE SETTINGS (Always accessible) */}
          {!isDesktopCollapsed && (
            <div className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Configuration
            </div>
          )}
          <Link 
            href="/dashboard/settings" 
            className={navItemClass('/dashboard/settings')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Store Settings")}
            onFocus={(e) => handleTooltipEnter(e, "Store Settings")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <Settings className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Store Settings</span>}
            </div>
          </Link>
        </nav>

        {/* Sidebar Footer Store Switcher & Collapse Button */}
        <div className={`p-3 bg-[#0F172A] ${isDesktopCollapsed ? 'hidden' : 'block'}`}>
          <StoreSwitcherDropdown />
        </div>

        {/* Collapse / Expand Footer Action */}
        {onToggleCollapse && (
          <div className="p-2 border-t border-slate-800/80 hidden md:block bg-[#0F172A]">
            <button
              onClick={onToggleCollapse}
              className={`w-full flex items-center text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors ${
                isDesktopCollapsed ? 'p-2 justify-center' : 'px-3 py-2 justify-between'
              }`}
              title={isDesktopCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
            >
              {!isDesktopCollapsed && <span>Collapse Sidebar</span>}
              {isDesktopCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-slate-400 hover:text-white" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400 hover:text-white" />
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Portal Tooltip */}
      {mounted && tooltipData.show && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed px-2.5 py-1.5 bg-slate-800 text-white text-[12px] font-medium rounded-md shadow-lg z-[9999] whitespace-nowrap flex items-center gap-1.5 pointer-events-none before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-[4px] before:border-transparent before:border-r-slate-800 transition-opacity duration-150 ${tooltipData.show ? 'opacity-100' : 'opacity-0'}`}
          style={{
            top: tooltipData.top,
            left: tooltipData.left,
            transform: 'translateY(-50%)',
            visibility: tooltipData.show ? 'visible' : 'hidden',
            transitionDelay: tooltipData.show ? '150ms' : '0ms'
          }}
        >
          {tooltipData.label}
          {tooltipData.badge && (
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white leading-none">
              {tooltipData.badge}
            </span>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
