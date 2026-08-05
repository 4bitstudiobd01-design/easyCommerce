'use client';

import React, { Component, ReactNode, Suspense } from 'react';
import { ErrorCard } from '../components/core/ErrorCard';
import { Skeleton } from '@/components/ui/Skeleton';

interface ErrorBoundaryProps {
  widgetId: string;
  fallback?: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class WidgetErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[WidgetBoundary Error] Widget "${this.props.widgetId}" crashed:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorCard
          title="Widget Error"
          message={`Widget "${this.props.widgetId}" encountered a runtime error.`}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

export function DefaultWidgetSkeleton() {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export interface WidgetBoundaryProps {
  widgetId: string;
  fallbackSkeleton?: ReactNode;
  children: ReactNode;
}

export function WidgetBoundary({ widgetId, fallbackSkeleton, children }: WidgetBoundaryProps) {
  return (
    <WidgetErrorBoundary widgetId={widgetId}>
      <Suspense fallback={fallbackSkeleton || <DefaultWidgetSkeleton />}>
        {children}
      </Suspense>
    </WidgetErrorBoundary>
  );
}
