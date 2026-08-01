import Image from 'next/image';
import { Globe2, ShoppingCart, Users, DollarSign, TrendingUp } from 'lucide-react';

export function GlobalImpact() {
  const stats = [
    { value: '25,409+', label: 'Over 25k Merchant Orders', icon: ShoppingCart, color: 'text-blue-600' },
    { value: '100k', label: 'Users used our platform around the world', icon: Users, color: 'text-emerald-600' },
    { value: '৳3,787.8M', label: 'Total Order Amount Processed', icon: DollarSign, color: 'text-indigo-600' },
    { value: '৳8M', label: "Today's Merchant Sales Volume", icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <section className="py-20 px-6 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12 text-center">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Global Scale & Impact
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Empowering entrepreneurs around the world
          </h2>
          <p className="text-slate-500 text-base font-normal">
            Processing high-concurrency order volumes with sub-second tenant latency.
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
                Active Nodes: Dhaka • Chittagong • Sylhet • Global Replicas
              </span>
            </div>
          </div>
        </div>

        {/* Clean Stats Row (Card-free pure typography) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-6 max-w-6xl mx-auto">
          {stats.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div key={idx} className="space-y-2 text-center">
                <div className="p-2 w-fit mx-auto text-blue-600 bg-blue-50 rounded-xl border border-blue-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
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
