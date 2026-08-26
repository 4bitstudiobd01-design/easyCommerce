'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  Bookmark,
  ArrowLeftRight,
  PieChart,
  Headphones,
  Bell,
  Boxes,
  Activity,
  UserCheck,
  KeyRound,
  FileText,
  Shield,
  Settings,
  Flag,
  Cpu,
  Wrench,
  BarChart2,
  TrendingUp,
  FileBarChart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { NAVIGATION_SECTIONS } from '../data/dashboardMockData';

interface AdminSidebarProps {
  isCollapsed: boolean;
  isMobileOpen?: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  isCollapsed,
  isMobileOpen = false,
  onToggleCollapse,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const getIcon = (iconName: string) => {
    const iconClass = 'w-4 h-4 shrink-0 transition-transform duration-200';
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      case 'Store':
        return <Store className={iconClass} />;
      case 'CreditCard':
        return <CreditCard className={iconClass} />;
      case 'Bookmark':
        return <Bookmark className={iconClass} />;
      case 'ArrowLeftRight':
        return <ArrowLeftRight className={iconClass} />;
      case 'PieChart':
        return <PieChart className={iconClass} />;
      case 'Headphones':
        return <Headphones className={iconClass} />;
      case 'Bell':
        return <Bell className={iconClass} />;
      case 'Boxes':
        return <Boxes className={iconClass} />;
      case 'Activity':
        return <Activity className={iconClass} />;
      case 'UserCheck':
        return <UserCheck className={iconClass} />;
      case 'KeyRound':
        return <KeyRound className={iconClass} />;
      case 'FileText':
        return <FileText className={iconClass} />;
      case 'Shield':
        return <Shield className={iconClass} />;
      case 'Settings':
        return <Settings className={iconClass} />;
      case 'Flag':
        return <Flag className={iconClass} />;
      case 'Cpu':
        return <Cpu className={iconClass} />;
      case 'Wrench':
        return <Wrench className={iconClass} />;
      case 'BarChart2':
        return <BarChart2 className={iconClass} />;
      case 'TrendingUp':
        return <TrendingUp className={iconClass} />;
      case 'FileBarChart':
        return <FileBarChart className={iconClass} />;
      default:
        return <LayoutDashboard className={iconClass} />;
    }
  };

  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      id="admin-sidebar"
      className={`h-screen bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none z-30
        fixed inset-y-0 left-0 md:static
        ${
          isMobileOpen
            ? 'translate-x-0 w-64 min-w-[256px] shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        }
        ${
          isCollapsed
            ? 'w-[72px] min-w-[72px] max-w-[72px]'
            : 'w-64 min-w-[256px] max-w-[256px]'
        }
      `}
    >
      {/* 1. Brand / Logo Header (Always fixed at top of sidebar) */}
      <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={isCollapsed ? onToggleCollapse : undefined}
          className={`flex items-center gap-3 min-w-0 text-left ${
            isCollapsed ? 'cursor-pointer hover:opacity-80' : ''
          }`}
          title={isCollapsed ? 'Click to expand sidebar' : undefined}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shadow-emerald-600/30 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>

          {(isMobileOpen || !isCollapsed) && (
            <div className="overflow-hidden transition-opacity duration-200 truncate">
              <span className="font-bold text-[15px] text-slate-900 leading-none block tracking-tight truncate">
                EasyCommerce
              </span>
              <span className="text-[10px] font-medium text-slate-400 block mt-0.5 truncate">
                Platform Admin
              </span>
            </div>
          )}
        </button>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation Sections List (Independently scrollable inside sidebar) */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        {NAVIGATION_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {isMobileOpen || !isCollapsed ? (
              <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                {section.title}
              </div>
            ) : (
              <div className="h-px bg-slate-100 mx-2 my-1.5" />
            )}

            {section.items.map((item) => {
              const active = isItemActive(item.href);
              const showCompact = !isMobileOpen && isCollapsed;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={showCompact ? item.title : undefined}
                  className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${showCompact ? 'justify-center px-2' : ''}`}
                >
                  <span className={active ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-800'}>
                    {getIcon(item.iconName)}
                  </span>

                  {!showCompact && (
                    <div className="flex-1 flex items-center justify-between truncate">
                      <span className="truncate">{item.title}</span>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white min-w-5 text-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {showCompact && item.badge !== undefined && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* 3. Footer Collapse / Expand Toggle Button (Pinned at bottom of sidebar) */}
      <div className="p-3 border-t border-slate-100 shrink-0 bg-white">
        <button
          type="button"
          id="sidebar-collapse-toggle"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCollapse();
          }}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
