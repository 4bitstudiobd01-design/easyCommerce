import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Warehouse,
  CreditCard,
  Truck,
  Megaphone,
  BarChart3,
  Tag,
  Settings,
  Bell,
  ChevronDown,
  MoreHorizontal,
  ShoppingBag,
  Search,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Orders', icon: ShoppingCart },
  { label: 'Products', icon: Package },
  { label: 'Customers', icon: Users },
  { label: 'Inventory', icon: Warehouse },
  { label: 'Payments', icon: CreditCard },
  { label: 'Courier', icon: Truck },
  { label: 'Marketing', icon: Megaphone },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Discounts', icon: Tag },
  { label: 'Store Settings', icon: Settings },
];

const STATS = [
  { label: 'Total Revenue', value: '৳2,45,000', change: '+18.6%' },
  { label: 'Orders', value: '1,256', change: '+14.8%' },
  { label: 'Customers', value: '1,024', change: '+16.2%' },
];

const CHART_POINTS = '0,58 14,42 28,50 42,20 56,34 70,12 84,26 100,6';

const TOP_PRODUCTS = [
  { name: 'Smart Watch', price: '৳5,290' },
  { name: 'Wireless Headphone', price: '৳2,180' },
  { name: 'Running Shoes', price: '৳1,890' },
];

const STATUS_BREAKDOWN = [
  { label: 'Delivered', pct: 60, color: '#2563EB' },
  { label: 'Processing', pct: 25, color: '#93C5FD' },
  { label: 'Pending', pct: 10, color: '#FDE68A' },
  { label: 'Cancelled', pct: 5, color: '#FCA5A5' },
];

const BEST_SELLERS = [
  { name: 'Casual T-Shirt', price: '৳1,200' },
  { name: 'Denim Jacket', price: '৳2,400' },
];

export function MerchantDashboardPreview() {
  const donutGradient = (() => {
    let cursor = 0;
    const stops = STATUS_BREAKDOWN.map((s) => {
      const start = cursor;
      cursor += s.pct;
      return `${s.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  })();

  return (
    <div className="relative w-full">
      {/* Dashboard window */}
      <div className="flex w-full rounded-2xl bg-white shadow-2xl shadow-slate-900/10 overflow-hidden border border-slate-100">
        {/* Sidebar */}
        <div className="w-[34%] bg-[#0B1230] flex flex-col py-5 px-3.5">
          <div className="flex items-center gap-2 px-1.5 mb-6">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <ShoppingBag className="w-3 h-3" strokeWidth={1.5} />
            </div>
            <span className="text-white text-[11px] font-extrabold tracking-tight">BitCommerce</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-semibold ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                <Icon className="w-2.5 h-2.5 shrink-0" strokeWidth={2} />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-slate-50 p-3.5 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-slate-900">Dashboard</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Search className="w-2.5 h-2.5" />
              <Bell className="w-2.5 h-2.5" />
              <div className="w-3.5 h-3.5 rounded-full bg-slate-300" />
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-1.5 mb-2.5">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white rounded-lg border border-slate-100 p-2">
                <p className="text-[7px] font-semibold text-slate-400 mb-1 truncate">{s.label}</p>
                <p className="text-[9.5px] font-extrabold text-slate-900 leading-none">{s.value}</p>
                <p className="text-[6.5px] font-bold text-emerald-500 mt-1">{s.change}</p>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-lg border border-slate-100 p-2 mb-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[7.5px] font-bold text-slate-700">Revenue Overview</span>
              <span className="flex items-center gap-0.5 text-[6.5px] font-semibold text-slate-400">
                Last 30 days <ChevronDown className="w-2 h-2" />
              </span>
            </div>
            <svg viewBox="0 0 100 60" className="w-full h-10" preserveAspectRatio="none">
              <polyline
                points={CHART_POINTS}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-white rounded-lg border border-slate-100 p-2">
              <span className="text-[7.5px] font-bold text-slate-700 block mb-1.5">Top Products</span>
              <div className="flex flex-col gap-1.5">
                {TOP_PRODUCTS.map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="w-3 h-3 rounded-full bg-[#DCE5F9] shrink-0" />
                      <span className="text-[6.5px] font-semibold text-slate-600 truncate">{p.name}</span>
                    </div>
                    <span className="text-[6.5px] font-bold text-slate-900 shrink-0">{p.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-100 p-2 flex flex-col items-center">
              <span className="text-[7.5px] font-bold text-slate-700 self-start mb-1.5">Orders by Status</span>
              <div
                className="w-11 h-11 rounded-full mb-1.5 flex items-center justify-center"
                style={{ backgroundImage: donutGradient }}
              >
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[6px] font-extrabold text-slate-900">
                  1,256
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 w-full">
                {STATUS_BREAKDOWN.map((s) => (
                  <div key={s.label} className="flex items-center gap-0.5">
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-[5.5px] font-semibold text-slate-500 truncate">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phone mockup, overlapping bottom-right */}
      <div className="absolute -bottom-8 -right-4 w-[30%] rounded-[1.1rem] bg-slate-900 p-1 shadow-2xl shadow-slate-900/20 border-4 border-slate-900">
        <div className="rounded-[0.85rem] overflow-hidden bg-white">
          <div className="flex items-center justify-between px-2 pt-1.5 pb-1 bg-white">
            <span className="text-[6px] font-bold text-slate-900">9:41</span>
            <MoreHorizontal className="w-2 h-2 text-slate-900" />
          </div>
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
            <span className="text-[7.5px] font-extrabold text-slate-900">Urban Style</span>
            <ShoppingCart className="w-2.5 h-2.5 text-slate-700" />
          </div>
          <div className="m-1.5 rounded-md bg-gradient-to-br from-blue-600 to-blue-500 p-1.5">
            <p className="text-[6px] font-extrabold text-white leading-tight">New Arrivals</p>
            <p className="text-[5px] font-medium text-blue-100 mb-1">Summer Collection</p>
            <span className="inline-block text-[5px] font-bold text-blue-600 bg-white rounded px-1 py-0.5">
              Shop Now
            </span>
          </div>
          <div className="flex justify-between px-2 mb-1.5">
            {['Men', 'Women', 'Shoes', 'Bags'].map((cat) => (
              <div key={cat} className="flex flex-col items-center gap-0.5">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-100" />
                <span className="text-[4.5px] font-semibold text-slate-500">{cat}</span>
              </div>
            ))}
          </div>
          <div className="px-2 pb-2">
            <span className="text-[6px] font-bold text-slate-700 block mb-1">Best Sellers</span>
            <div className="grid grid-cols-2 gap-1">
              {BEST_SELLERS.map((p) => (
                <div key={p.name} className="rounded-md border border-slate-100 p-1">
                  <div className="w-full h-6 rounded bg-slate-100 mb-1" />
                  <p className="text-[5px] font-bold text-slate-800 truncate">{p.name}</p>
                  <p className="text-[5px] font-extrabold text-blue-600">{p.price}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
