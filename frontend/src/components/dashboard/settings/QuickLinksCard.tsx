'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Clock,
  Key,
  ChevronRight,
} from 'lucide-react';
import { QuickLinkItem } from './types';

export const SETTINGS_QUICK_LINKS: QuickLinkItem[] = [
  {
    id: 'link-gateways',
    title: 'Payment Gateways',
    description: 'Manage platform payment integrations',
    iconName: 'ShieldCheck',
    href: '/admin/integrations',
  },
  {
    id: 'link-email',
    title: 'Email Templates',
    description: 'Customize platform email templates',
    iconName: 'Mail',
    href: '/admin/notifications',
  },
  {
    id: 'link-backup',
    title: 'Backup & Restore',
    description: 'Manage database backups and restore',
    iconName: 'Clock',
    href: '/admin/maintenance',
  },
  {
    id: 'link-api',
    title: 'API Keys',
    description: 'Manage platform API keys',
    iconName: 'Key',
    href: '/admin/security',
  },
];

interface QuickLinksCardProps {
  links?: QuickLinkItem[];
}

export function QuickLinksCard({ links = SETTINGS_QUICK_LINKS }: QuickLinksCardProps) {
  const getIcon = (name: string) => {
    const iconClass = 'w-4 h-4';
    switch (name) {
      case 'ShieldCheck':
        return <ShieldCheck className={`${iconClass} text-blue-600`} />;
      case 'Mail':
        return <Mail className={`${iconClass} text-blue-600`} />;
      case 'Clock':
        return <Clock className={`${iconClass} text-blue-600`} />;
      case 'Key':
        return <Key className={`${iconClass} text-purple-600`} />;
      default:
        return <ShieldCheck className={`${iconClass} text-blue-600`} />;
    }
  };

  const getIconBg = (name: string) => {
    switch (name) {
      case 'Key':
        return 'bg-purple-50 border-purple-100/80';
      default:
        return 'bg-blue-50 border-blue-100/80';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-2 border-b border-slate-100 uppercase">
        Quick Links
      </h3>

      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${getIconBg(
                  link.iconName
                )}`}
              >
                {getIcon(link.iconName)}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-950 truncate">
                  {link.title}
                </h4>
                <span className="text-[11px] text-slate-400 block truncate">
                  {link.description}
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </Link>
        ))}
      </div>
    </div>
  );
}
