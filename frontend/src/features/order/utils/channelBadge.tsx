import React from 'react';
import { Facebook, Instagram, Search, Mail, Share2, Link2, Globe } from 'lucide-react';

interface ChannelDisplay {
  label: string;
  icon: React.ReactNode;
  colorClasses: string;
}

const ICON_CLASS = 'w-3 h-3';

/**
 * `utmSource` carries the specific platform (e.g. "facebook", "tiktok") when a
 * checkout link was tagged with one; `channel` is only the broad bucket
 * (`normalizeChannel` in the backend collapses all social platforms into
 * "social"). Prefer the specific source when present, falling back to the
 * bucket otherwise — this is the only way to distinguish "Facebook" from
 * "Instagram" in the UI at all.
 */
function resolveDisplay(channel?: string, utmSource?: string): ChannelDisplay {
  const source = utmSource?.toLowerCase().trim();

  if (source?.includes('facebook') || source === 'fb') {
    return { label: 'Facebook', icon: <Facebook className={ICON_CLASS} />, colorClasses: 'bg-blue-50 text-blue-700' };
  }
  if (source?.includes('instagram') || source === 'ig') {
    return { label: 'Instagram', icon: <Instagram className={ICON_CLASS} />, colorClasses: 'bg-pink-50 text-pink-700' };
  }
  if (source?.includes('tiktok')) {
    return { label: 'TikTok', icon: <Share2 className={ICON_CLASS} />, colorClasses: 'bg-slate-100 text-slate-700' };
  }
  if (source?.includes('google')) {
    return { label: 'Google', icon: <Search className={ICON_CLASS} />, colorClasses: 'bg-amber-50 text-amber-700' };
  }

  switch (channel) {
    case 'direct':
      return { label: 'Direct', icon: <Link2 className={ICON_CLASS} />, colorClasses: 'bg-slate-100 text-slate-600' };
    case 'social':
      return { label: 'Social', icon: <Share2 className={ICON_CLASS} />, colorClasses: 'bg-purple-50 text-purple-700' };
    case 'organic_search':
      return { label: 'Search', icon: <Search className={ICON_CLASS} />, colorClasses: 'bg-amber-50 text-amber-700' };
    case 'paid_search':
      return { label: 'Paid Search', icon: <Search className={ICON_CLASS} />, colorClasses: 'bg-orange-50 text-orange-700' };
    case 'referral':
      return { label: 'Referral', icon: <Link2 className={ICON_CLASS} />, colorClasses: 'bg-cyan-50 text-cyan-700' };
    case 'email':
      return { label: 'Email', icon: <Mail className={ICON_CLASS} />, colorClasses: 'bg-indigo-50 text-indigo-700' };
    default:
      // Unmapped/unknown values (including "other") get a safe generic badge
      // rather than breaking or hiding the column.
      return {
        label: source ? source.charAt(0).toUpperCase() + source.slice(1) : (channel ? channel.charAt(0).toUpperCase() + channel.slice(1) : 'Unknown'),
        icon: <Globe className={ICON_CLASS} />,
        colorClasses: 'bg-slate-100 text-slate-600',
      };
  }
}

export function ChannelBadge({ channel, utmSource }: { channel?: string; utmSource?: string }) {
  const { label, icon, colorClasses } = resolveDisplay(channel, utmSource);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${colorClasses}`}>
      {icon}
      {label}
    </span>
  );
}
