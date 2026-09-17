import React from 'react';

export type OmnichannelPlatform =
  | 'facebook'
  | 'messenger'
  | 'instagram'
  | 'tiktok'
  | 'whatsapp'
  | 'telegram';

interface PlatformIconProps {
  platform: OmnichannelPlatform | string;
  className?: string;
  size?: number;
}

export function PlatformIcon({
  platform,
  className = '',
  size = 20,
}: PlatformIconProps) {
  const norm = (platform || '').toLowerCase();

  // Facebook
  if (norm === 'facebook' || norm === 'fb') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#1877F2" />
        <path
          d="M16.5 12.05h-2.55v8.95h-3.7V12.05H8.2V8.91h2.05V6.63C10.25 4.6 11.49 3 14.15 3c1.13 0 2.11.08 2.39.12v2.77h-1.64c-.98 0-1.25.47-1.25 1.23v1.79h3.08l-.23 3.14z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // Messenger
  if (norm === 'messenger' || norm === 'fb-messenger') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <defs>
          <linearGradient id="msg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00B2FF" />
            <stop offset="50%" stopColor="#006AFF" />
            <stop offset="100%" stopColor="#9B3FE4" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#msg-grad)" />
        <path
          d="M12 4C7.58 4 4 7.24 4 11.23c0 2.28 1.17 4.32 3 5.66v2.85l2.74-1.51c.71.2 1.47.3 2.26.3 4.42 0 8-3.24 8-7.23S16.42 4 12 4zm.8 9.77l-2.05-2.18-4 2.18 4.4-4.68 2.05 2.18 4-2.18-4.4 4.68z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // Instagram
  if (norm === 'instagram' || norm === 'ig') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <defs>
          <radialGradient
            id="ig-radial"
            cx="30%"
            cy="107%"
            r="150%"
            gradientTransform="rotate(-45)"
          >
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill="url(#ig-radial)" />
        <rect
          x="4.5"
          y="4.5"
          width="15"
          height="15"
          rx="4.5"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="12" r="3.6" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="16.2" cy="7.8" r="1.1" fill="#FFFFFF" />
      </svg>
    );
  }

  // TikTok
  if (norm === 'tiktok') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#010101" />
        <path
          d="M16.8 8.2a4.4 4.4 0 0 1-2.9-2V4h-2.6v11.2a2.3 2.3 0 1 1-2.3-2.3c.4 0 .7.1 1 .28V10.7A4.8 4.8 0 0 0 6.5 15a4.8 4.8 0 0 0 4.8 4.8c2.6 0 4.8-2.1 4.8-4.8V9.6a6.5 6.5 0 0 0 3.4.9V8a4.5 4.5 0 0 1-2.7-.8z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // WhatsApp
  if (norm === 'whatsapp' || norm === 'wa') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#25D366" />
        <path
          d="M12 4a7.9 7.9 0 0 0-6.85 11.85L4 20l4.3-1.13A7.9 7.9 0 1 0 12 4zm4.61 11.23c-.19.54-1.12 1.05-1.55 1.09-.4.04-.92.05-1.48-.13-.34-.11-.78-.26-1.34-.51-2.38-1.03-3.93-3.46-4.05-3.62-.12-.16-.97-1.3-.97-2.47 0-1.17.62-1.74.84-1.98.22-.24.48-.3.64-.3.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.5.14.24.62 1.03 1.34 1.67.92.82 1.7 1.07 1.94 1.19.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.13 1.12z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // Telegram
  if (norm === 'telegram' || norm === 'tg') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#229ED9" />
        <path
          d="M18.2 6.8 5.7 11.6c-.85.34-.84.82-.16 1.03l3.2 1 7.42-4.68c.35-.21.67-.1.4.14l-6.01 5.43-.22 3.32c.32 0 .47-.15.65-.33l1.57-1.52 3.26 2.41c.6.33 1.03.16 1.18-.55l2.14-10.08c.22-.88-.34-1.28-.93-.97z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-md bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 ${className}`}
    >
      {platform.slice(0, 1).toUpperCase()}
    </div>
  );
}

