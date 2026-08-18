import Image from 'next/image';
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
  ShoppingBag,
  MoreHorizontal,
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

const CHART_POINTS = [
  [0, 46],
  [12.5, 34],
  [25, 40],
  [37.5, 16],
  [50, 28],
  [62.5, 8],
  [75, 20],
  [87.5, 12],
  [100, 4],
];

const BEST_SELLERS = [
  { name: 'Casual T-Shirt', price: '৳1,200', image: '/product-tshirt.jpg', position: '50% 50%' },
  { name: 'Denim Jacket', price: '৳2,400', image: '/product-jacket.jpg', position: '80% 40%' },
];

export function MerchantDashboardPreview() {
  const polyline = CHART_POINTS.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <div className="relative w-full">
      {/* Dashboard window */}
      <div className="flex w-full rounded-2xl bg-white shadow-2xl shadow-slate-900/10 overflow-hidden border border-slate-100">
        {/* Sidebar */}
        <div className="w-[32%] bg-[#0B1230] flex flex-col py-5 px-3.5">
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
            <div>
              <p className="text-[10px] font-extrabold text-slate-900 flex items-center gap-1">
                Welcome back, Merchant <span>👋</span>
              </p>
              <p className="text-[6.5px] font-medium text-slate-400 mt-0.5">
                Here&apos;s what&apos;s happening with your store today.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
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
          <div className="bg-white rounded-lg border border-slate-100 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-bold text-slate-700">Revenue Overview</span>
              <span className="flex items-center gap-0.5 text-[6.5px] font-semibold text-slate-400">
                Last 30 days <ChevronDown className="w-2 h-2" />
              </span>
            </div>
            <svg viewBox="0 0 100 50" className="w-full h-16" preserveAspectRatio="none">
              <polyline
                points={polyline}
                fill="none"
                stroke="#2563EB"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {CHART_POINTS.map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r="1.4" fill="#2563EB" />
              ))}
            </svg>
            <div className="flex justify-between mt-1">
              {['Jul 15', 'Jul 22', 'Jul 29', 'Aug 5', 'Aug 12'].map((d) => (
                <span key={d} className="text-[5.5px] font-semibold text-slate-400">{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phone mockup, overlapping bottom-right */}
      <div className="absolute -bottom-9 -right-5 w-[32%] rounded-[1.1rem] bg-slate-900 p-1 shadow-2xl shadow-slate-900/20 border-4 border-slate-900">
        <div className="rounded-[0.85rem] overflow-hidden bg-white">
          <div className="flex items-center justify-between px-2 pt-1.5 pb-1 bg-white">
            <span className="text-[6px] font-bold text-slate-900">9:41</span>
            <MoreHorizontal className="w-2 h-2 text-slate-900" />
          </div>
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100">
            <span className="text-[7.5px] font-extrabold text-slate-900">Urban Style</span>
            <ShoppingCart className="w-2.5 h-2.5 text-slate-700" />
          </div>
          <div className="relative m-1.5 h-14 rounded-md overflow-hidden">
            <Image src="/new-arrivals-banner.jpg" alt="" fill sizes="200px" className="object-cover object-[50%_65%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-0 p-1.5 flex flex-col justify-end">
              <p className="text-[6px] font-extrabold text-white leading-tight">New Arrivals</p>
              <p className="text-[5px] font-medium text-white/80 mb-1">Summer Collection</p>
              <span className="inline-block w-fit text-[5px] font-bold text-blue-600 bg-white rounded px-1 py-0.5">
                Shop Now
              </span>
            </div>
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
                <div key={p.name} className="rounded-md border border-slate-100 overflow-hidden">
                  <div className="relative w-full h-8">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="100px"
                      className="object-cover"
                      style={{ objectPosition: p.position }}
                    />
                  </div>
                  <div className="p-1">
                    <p className="text-[5px] font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[5px] font-extrabold text-blue-600">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
