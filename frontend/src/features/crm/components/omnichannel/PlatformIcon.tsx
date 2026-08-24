import React from 'react';

export type OmnichannelPlatform =
  | 'telegram'
  | 'whatsapp'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'x'
  | 'shopify'
  | 'slack'
  | 'hubspot'
  | 'custom';

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

  if (norm === 'linkedin' || norm === 'li') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#0A66C2" />
        <path
          d="M7.4 9.1H4.6V18h2.8V9.1zM6 4.9C5.1 4.9 4.4 5.6 4.4 6.5s.7 1.6 1.6 1.6 1.6-.7 1.6-1.6c0-.9-.7-1.6-1.6-1.6zM19.6 12.8c0-2.6-1.4-3.9-3.3-3.9-1.5 0-2.2.8-2.6 1.4V9.1h-2.8c.04.8 0 8.9 0 8.9h2.8v-5c0-.27.02-.54.1-.73.22-.54.72-1.1 1.57-1.1 1.1 0 1.55.84 1.55 2.08V18h2.8v-5.2z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (norm === 'x' || norm === 'twitter') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#000000" />
        <path
          d="M14.9 5.5h2.3l-5 5.72 5.9 7.78h-4.6l-3.6-4.72-4.1 4.72H3.5l5.36-6.13L3.2 5.5h4.7l3.25 4.3 3.75-4.3zm-.8 12.1h1.27L7.96 6.8H6.6l7.5 10.8z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (norm === 'shopify') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#95BF47" />
        <path
          d="M17.4 6.9c-.1-.3-.4-.5-.7-.5s-.4 0-.5.1c-.1-.9-.7-2.5-2.2-2.5h-.4C13.4 3.7 13 4 12.7 4.5c-.7-.1-1.3.3-1.6.8L9.2 6.5C8.9 6.6 8.7 6.8 8.6 7.1L6.5 17.2c-.1.5.3 1 .8 1.1h9.4c.5 0 .9-.4 1-.9l1.4-9.8c0-.2 0-.5-.3-.7z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (norm === 'slack') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#4A154B" />
        <path
          d="M8.5 12a1.5 1.5 0 1 1-1.5-1.5H8.5V12zm.8 0a1.5 1.5 0 0 1 3 0v3.8a1.5 1.5 0 0 1-3 0V12zm3.7-3.5a1.5 1.5 0 1 1 1.5-1.5v1.5H13zm0 .8a1.5 1.5 0 0 1 0 3H9.2a1.5 1.5 0 0 1 0-3H13zm2.5 4.7a1.5 1.5 0 1 1 1.5 1.5h-1.5V14zm-.8 0a1.5 1.5 0 0 1-3 0v-3.8a1.5 1.5 0 0 1 3 0V14zm-3.7 3.5a1.5 1.5 0 1 1-1.5 1.5v-1.5H11zm0-.8a1.5 1.5 0 0 1 0-3h3.8a1.5 1.5 0 0 1 0 3H11z"
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
