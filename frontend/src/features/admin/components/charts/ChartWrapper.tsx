'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export interface ChartWrapperProps {
  heightPx?: number;
  className?: string;
  children: ReactNode;
}

export function ChartWrapper({ heightPx = 280, className = '', children }: ChartWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div style={{ height: `${heightPx}px` }} className={`w-full flex items-center justify-center ${className}`}>
        <Skeleton className="w-full h-full rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div style={{ height: `${heightPx}px` }} className={`w-full relative ${className}`}>
      {children}
    </div>
  );
}
