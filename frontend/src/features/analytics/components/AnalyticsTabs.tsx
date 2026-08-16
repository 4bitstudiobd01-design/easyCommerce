import React from 'react';

export function AnalyticsTabs() {
  const tabs = ['Overview'];
  
  return (
    <div className="bg-white px-8 border-b border-slate-200">
      <div className="flex items-center gap-8 text-[13px] font-bold">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            className={`py-3 ${
              idx === 0
                ? 'border-b-2 border-blue-600 text-blue-600 -mb-[1px]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
