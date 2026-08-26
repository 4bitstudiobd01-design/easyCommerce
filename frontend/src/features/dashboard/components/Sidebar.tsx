'use client';

import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StoreSwitcherDropdown } from '@/features/tenant/components/StoreSwitcherDropdown';
import { useGetMerchantOrderKpisQuery } from '@/features/order/api/orderApi';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderTree,
  Users,
  Truck,
  Tag,
  Settings,
  Store as StoreIcon,
  Layers,
  CreditCard,
  Megaphone,
  BarChart2,
  MonitorSmartphone,
  FileText,
  ShoppingBag,
  Target,
  Activity,
  BarChart3,
  MessageSquare,
  KeyRound,
  PanelLeftClose,
  PanelLeftOpen,
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
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
      ? 'bg-blue-600 text-white font-semibold'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium';
    return `${baseClasses} ${sizeClasses} ${activeClasses}`;
  };

  const iconClass = isDesktopCollapsed ? "w-5 h-5 shrink-0" : "w-4 h-4 shrink-0";
  const iconStroke = isDesktopCollapsed ? 1.75 : 2;

  const NavGroupHeader = ({ children }: { children: React.ReactNode }) => {
    if (isDesktopCollapsed) {
      return children === 'Main Menu' ? null : <div className="h-3" />;
    }
    return (
      <div className="px-3 pb-1 pt-5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {children}
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
          
          <NavGroupHeader>Main Menu</NavGroupHeader>
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

          <NavGroupHeader>Sales</NavGroupHeader>
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

          <NavGroupHeader>CRM & Growth</NavGroupHeader>
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
            onMouseEnter={(e) => handleTooltipEnter(e, "Channel Integrations")}
            onFocus={(e) => handleTooltipEnter(e, "Channel Integrations")}
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
            onMouseEnter={(e) => handleTooltipEnter(e, "Segments")}
            onFocus={(e) => handleTooltipEnter(e, "Segments")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <Layers className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Segments</span>}
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

          <NavGroupHeader>Catalog</NavGroupHeader>
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

          <NavGroupHeader>Operations</NavGroupHeader>
          {/* <Link 
            href="/dashboard/payments" 
            className={navItemClass('/dashboard/payments')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Payments")}
            onFocus={(e) => handleTooltipEnter(e, "Payments")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Payments</span>}
            </div>
          </Link> */}
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

          <NavGroupHeader>Marketing</NavGroupHeader>
          {/* <Link 
            href="/dashboard/coupons" 
            className={navItemClass('/dashboard/coupons')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Coupons")}
            onFocus={(e) => handleTooltipEnter(e, "Coupons")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <Tag className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Coupons</span>}
            </div>
          </Link> */}
          <Link 
            href="/dashboard/marketing" 
            className={navItemClass('/dashboard/marketing')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Marketing")}
            onFocus={(e) => handleTooltipEnter(e, "Marketing")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <Megaphone className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Marketing</span>}
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
            href="/dashboard/analytics"
            className={navItemClass('/dashboard/analytics')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Analytics")}
            onFocus={(e) => handleTooltipEnter(e, "Analytics")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <BarChart2 className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Analytics</span>}
            </div>
          </Link>

          <NavGroupHeader>Store</NavGroupHeader>
          <Link 
            href="/dashboard/themes" 
            className={navItemClass('/dashboard/themes')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Storefront")}
            onFocus={(e) => handleTooltipEnter(e, "Storefront")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <MonitorSmartphone className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Storefront</span>}
            </div>
          </Link>
          {/* <Link 
            href="/dashboard/pages" 
            className={navItemClass('/dashboard/pages')}
            onMouseEnter={(e) => handleTooltipEnter(e, "Pages")}
            onFocus={(e) => handleTooltipEnter(e, "Pages")}
            onMouseLeave={handleTooltipLeave}
            onBlur={handleTooltipLeave}
          >
            <div className="flex items-center gap-2.5">
              <FileText className={iconClass} strokeWidth={iconStroke} />
              {!isDesktopCollapsed && <span>Pages</span>}
            </div>
          </Link> */}

          <NavGroupHeader>Settings</NavGroupHeader>
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
