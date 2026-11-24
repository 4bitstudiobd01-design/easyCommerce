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
  variant?: 'svg' | 'image';
}

export function PlatformIcon({
  platform,
  className = '',
  size = 20,
  variant = 'svg',
}: PlatformIconProps) {
  const norm = (platform || '').toLowerCase();

  // If raster image variant is explicitly requested
  if (variant === 'image') {
    const imageMap: Record<string, string> = {
      facebook: '/images/omnichannel/facebook.jpg',
      fb: '/images/omnichannel/facebook.jpg',
      tiktok: '/images/omnichannel/tiktok.jpg',
      whatsapp: '/images/omnichannel/whatsapp.jpg',
      wa: '/images/omnichannel/whatsapp.jpg',
      telegram: '/images/omnichannel/telegram.jpg',
      tg: '/images/omnichannel/telegram.jpg',
    };

    if (imageMap[norm]) {
      return (
        <img
          src={imageMap[norm]}
          alt={platform}
          width={size}
          height={size}
          className={`shrink-0 object-contain rounded-lg ${className}`}
          style={{ width: size, height: size }}
        />
      );
    }
  }

  // 1. Facebook: Official cobalt blue squircle with clean white bold 'f'
  if (norm === 'facebook' || norm === 'fb') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="48" height="48" rx="11" fill="#1877F2" />
        <path
          d="M29.5 24h-4.6v16h-6.6V24H15.1v-5.6h3.2v-3.7c0-4.3 2.6-6.7 6.5-6.7 1.9 0 3.5.1 4 .2v4.6h-2.7c-2.1 0-2.5 1-2.5 2.5v3.1h5.1l-.7 5.6z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 2. Messenger: Official Meta Messenger gradient with speech bubble & lightning
  if (norm === 'messenger' || norm === 'fb-messenger') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
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
        <rect width="48" height="48" rx="11" fill="url(#msg-grad)" />
        <path
          d="M24 9C15.7 9 9 15.1 9 22.6c0 4.3 2.2 8.1 5.6 10.6v5.3l5.1-2.8c1.3.4 2.8.6 4.3.6 8.3 0 15-6.1 15-13.6S32.3 9 24 9zm1.5 18.3l-3.8-4.1-7.5 4.1 8.2-8.8 3.8 4.1 7.5-4.1-8.2 8.8z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 3. Instagram: Official radial camera badge
  if (norm === 'instagram' || norm === 'ig') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
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
        <rect width="48" height="48" rx="11" fill="url(#ig-radial)" />
        <rect
          x="11"
          y="11"
          width="26"
          height="26"
          rx="7.5"
          stroke="#FFFFFF"
          strokeWidth="3.2"
        />
        <circle cx="24" cy="24" r="6.2" stroke="#FFFFFF" strokeWidth="3.2" />
        <circle cx="31.8" cy="16.2" r="1.8" fill="#FFFFFF" />
      </svg>
    );
  }

  // 4. TikTok: Signature black squircle with cyan & magenta chromatic 3D offset note
  if (norm === 'tiktok') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <rect width="48" height="48" rx="11" fill="#000000" />
        <g transform="translate(1.5, 1.5)">
          {/* Electric Cyan offset shadow */}
          <path
            d="M30.4 14.9a8.4 8.4 0 0 1-5.2-3.6V8h-4.8v20.4a4.5 4.5 0 1 1-4.5-4.5c.7 0 1.3.1 1.9.4v-5a9.2 9.2 0 0 0-1.9-.2 9.2 9.2 0 1 0 9.2 9.2V18.4a13 13 0 0 0 6.7-1.8v-4.9a8.3 8.3 0 0 1-1.4 3.2z"
            fill="#00F2FE"
            transform="translate(-1.2, -1.2)"
          />
          {/* Vivid Magenta offset shadow */}
          <path
            d="M30.4 14.9a8.4 8.4 0 0 1-5.2-3.6V8h-4.8v20.4a4.5 4.5 0 1 1-4.5-4.5c.7 0 1.3.1 1.9.4v-5a9.2 9.2 0 0 0-1.9-.2 9.2 9.2 0 1 0 9.2 9.2V18.4a13 13 0 0 0 6.7-1.8v-4.9a8.3 8.3 0 0 1-1.4 3.2z"
            fill="#FE2C55"
            transform="translate(1.2, 1.2)"
          />
          {/* Pure White core note */}
          <path
            d="M30.4 14.9a8.4 8.4 0 0 1-5.2-3.6V8h-4.8v20.4a4.5 4.5 0 1 1-4.5-4.5c.7 0 1.3.1 1.9.4v-5a9.2 9.2 0 0 0-1.9-.2 9.2 9.2 0 1 0 9.2 9.2V18.4a13 13 0 0 0 6.7-1.8v-4.9a8.3 8.3 0 0 1-1.4 3.2z"
            fill="#FFFFFF"
          />
        </g>
      </svg>
    );
  }

  // 5. WhatsApp: Official speech bubble badge with handset
  if (norm === 'whatsapp' || norm === 'wa') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        {/* Vibrant green speech bubble ring */}
        <path
          d="M24 6C14.06 6 6 14.06 6 24c0 3.47 1 6.73 2.72 9.49L6 42l8.78-2.3C17.44 41.05 20.62 42 24 42c9.94 0 18-8.06 18-18S33.94 6 24 6z"
          fill="#25D366"
        />
        {/* Crisp white inner circle */}
        <circle cx="24" cy="24" r="14.8" fill="#FFFFFF" />
        {/* Tilted green telephone handset */}
        <path
          d="M31.8 28.8c-.4-.2-2.3-1.1-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.3-.5.3-.9.1-.4-.2-1.6-.6-3.1-1.9-1.2-1-1.9-2.3-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.3-.4.4-.6.1-.3.1-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.4 3.8 1.6 4.1c.2.3 2.8 4.2 6.7 5.9 1 .4 1.7.6 2.3.8 1 .3 1.8.3 2.5.2.8-.1 2.3-.9 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"
          fill="#25D366"
        />
      </svg>
    );
  }

  // 6. Telegram: Signature sky blue circle with white 3D paper airplane
  if (norm === 'telegram' || norm === 'tg') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        className={`shrink-0 ${className}`}
      >
        <circle cx="24" cy="24" r="23" fill="#24A1DE" />
        <path
          d="M35.6 13.9L10.9 23.4c-1.68.67-1.66 1.62-.3 2.04l6.33 1.97 14.67-9.25c.69-.42 1.33-.2.8.27l-11.89 10.73.45 6.57c.64 0 .92-.29 1.28-.64l3.08-2.99 6.44 4.76c1.19.65 2.04.32 2.34-1.08l4.22-19.9c.43-1.75-.66-2.53-1.82-1.94z"
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

