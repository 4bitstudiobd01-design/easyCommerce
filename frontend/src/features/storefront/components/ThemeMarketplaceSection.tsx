import React from 'react';
import { Store, Search, ChevronDown, ChevronRight, Eye } from 'lucide-react';

const themes = [
  {
    id: 't1',
    name: 'Classic Modern Storefront',
    desc: 'Clean and modern design for any store.',
    category: 'General',
    type: 'FREE',
    price: null,
    btnText: 'Use Theme',
    imgColor: 'bg-blue-50',
    mockupIcon: 'bg-blue-100',
  },
  {
    id: 't2',
    name: 'Organic Storefront',
    desc: 'Perfect for organic and health stores.',
    category: 'Health & Beauty',
    type: 'FREE',
    price: null,
    btnText: 'Use Theme',
    imgColor: 'bg-amber-50',
    mockupIcon: 'bg-amber-100',
  },
  {
    id: 't3',
    name: 'Luxuria Fashion',
    desc: 'Elegant fashion theme with full features.',
    category: 'Fashion',
    type: 'PREMIUM',
    price: '৳1,500',
    btnText: 'View Details',
    imgColor: 'bg-rose-50',
    mockupIcon: 'bg-rose-100',
  },
  {
    id: 't4',
    name: 'TechHub Electronics',
    desc: 'Modern electronics and gadgets theme.',
    category: 'Electronics',
    type: 'PREMIUM',
    price: '৳2,000',
    btnText: 'View Details',
    imgColor: 'bg-slate-900',
    mockupIcon: 'bg-slate-800',
  },
];

const pills = ['All Themes', 'Free', 'Premium', 'Fashion', 'Electronics', 'Health & Beauty', 'Food', 'Minimal'];

export function ThemeMarketplaceSection() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <Store className="w-4 h-4 text-slate-700" />
        <h2 className="text-sm font-bold text-slate-900">Theme Marketplace</h2>
      </div>

      <div className="p-6">
        {/* Filters & Search */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
            {pills.map((pill, i) => (
              <button
                key={i}
                className={`px-4 h-8 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${
                  i === 0 ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search themes..." 
                className="h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 w-[200px]"
              />
            </div>
            <button className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
              Newest First
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="flex items-center gap-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {themes.map((theme) => (
              <div key={theme.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
                {/* Image Area */}
                <div className={`h-[160px] relative ${theme.imgColor} border-b border-slate-100 flex flex-col items-center justify-center overflow-hidden`}>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${theme.type === 'FREE' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-amber-500 text-white shadow-sm'}`}>
                      {theme.type}
                    </span>
                  </div>
                  {theme.price && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white text-slate-900 shadow-sm">
                        {theme.price}
                      </span>
                    </div>
                  )}
                  {/* Generic Mockup UI representation */}
                  <div className="w-[80%] h-[70%] bg-white rounded-t-lg shadow-sm border border-slate-200 mt-auto flex flex-col overflow-hidden transform group-hover:scale-105 transition-transform duration-300">
                    <div className="h-3 bg-slate-50 border-b border-slate-100 flex items-center px-2 gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                    </div>
                    <div className={`flex-1 ${theme.mockupIcon} flex items-center justify-center`}>
                      <span className={`text-[8px] font-bold ${theme.id === 't4' ? 'text-white/50' : 'text-slate-400/50'}`}>Preview</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded self-start mb-2">{theme.category}</span>
                  <h3 className="text-[14px] font-extrabold text-slate-900 mb-1.5 leading-tight">{theme.name}</h3>
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-6">{theme.desc}</p>
                  
                  <div className="mt-auto flex gap-3">
                    <button className="flex-1 h-9 rounded-xl border border-slate-200 bg-white text-blue-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      Live Preview
                    </button>
                    <button className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold flex items-center justify-center transition-colors shadow-sm">
                      {theme.btnText}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Arrow Right */}
          <button className="hidden xl:flex absolute -right-5 w-10 h-10 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm z-10 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
