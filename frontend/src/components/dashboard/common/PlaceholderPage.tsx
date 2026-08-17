'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Construction, Sparkles } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  section: string;
  description?: string;
}

export function PlaceholderPage({
  title,
  section,
  description = 'This module is currently being scaffolded as part of the EasyCommerce enterprise platform roadmap.',
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            <span>{section}</span>
            <span>/</span>
            <span className="text-emerald-600">{title}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-gray-500" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Modern Card View */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center max-w-2xl mx-auto shadow-sm my-12">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 text-emerald-600 shadow-sm">
          <Construction className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Modular Scaffolded Route</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">{title} Management</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          Full functionality for {title.toLowerCase()} will be attached to backend domain services and RTK Query endpoints.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/admin"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            Go to Dashboard Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
