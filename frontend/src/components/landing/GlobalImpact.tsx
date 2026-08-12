import Image from 'next/image';
import { Globe2, ShieldCheck, Layers, Zap, Building2 } from 'lucide-react';

export function GlobalImpact() {
  const pillars = [
    {
      value: 'Row-Level',
      label: 'Multi-Tenant Data Isolation Per Store',
      icon: ShieldCheck,
    },
    {
      value: 'Decoupled',
      label: 'Inventory Domain, Independent of Catalog',
      icon: Layers,
    },
    {
      value: 'Native',
      label: 'bKash, Nagad & Cards via SSLCommerz',
      icon: Zap,
    },
    {
      value: 'Built For',
      label: 'Bangladesh First, Global Ready',
      icon: Building2,
    },
  ];

  return (
    <section className="py-20 px-6 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12 text-center">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Architecture That Scales
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Built to grow with your business
          </h2>
          <p className="text-slate-500 text-base font-normal">
            A modular, multi-tenant foundation designed for high-concurrency order volumes from day one.
          </p>
        </div>

        {/* Dotted World Map WebP Graphic Container */}
        <div className="relative max-w-5xl mx-auto py-6 flex items-center justify-center">
          <div className="w-full h-64 md:h-96 relative flex items-center justify-center">
            {/* World Map WebP Image */}
            <Image
              src="/images/map.webp"
              alt="Global Scale Dotted World Map"
              fill
              className="object-contain opacity-95 pointer-events-none"
              priority
            />

            {/* Floating Active Node Badge */}
            <div className="relative z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-blue-200 shadow-md">
              <Globe2 className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: '15s' }} />
              <span className="text-xs font-bold text-slate-800">
                Headquartered in Dhaka, Bangladesh
              </span>
            </div>
          </div>
        </div>

        {/* Clean Stats Row (Card-free pure typography) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 max-w-6xl mx-auto">
          {pillars.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={idx} className="space-y-2 text-center">
                <div className="p-2 w-fit mx-auto text-blue-600 bg-blue-50 rounded-xl border border-blue-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {st.value}
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-[180px] mx-auto leading-relaxed">
                  {st.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
