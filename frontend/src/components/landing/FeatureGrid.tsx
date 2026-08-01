import { ShieldCheck, Smartphone, Truck, Layers, Lock, Cpu, BarChart3, Palette } from 'lucide-react';

export function FeatureGrid() {
  const features = [
    {
      icon: Smartphone,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      title: 'Native MFS & Gateways',
      desc: 'First-party integration with bKash, Nagad, Rocket, SSLCommerz, and automated COD verification.',
    },
    {
      icon: Truck,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      title: 'Automated Courier Logistics',
      desc: 'One-click order fulfillment and tracking labels for Steadfast, Pathao, RedX, and Paperfly.',
    },
    {
      icon: Layers,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      title: 'Decoupled Inventory Domain',
      desc: 'Separate stock tracking across multiple warehouses without locking product presentation definitions.',
    },
    {
      icon: Lock,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      title: 'Row-Level Multi-Tenancy',
      desc: 'Enterprise-grade PostgreSQL tenant isolation enforcing 100% data privacy per store.',
    },
    {
      icon: Palette,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      title: 'Zero-Code Theme Customizer',
      desc: 'Customize your storefront layout, banners, products, and navigation headers effortlessly.',
    },
    {
      icon: BarChart3,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      title: 'Real-Time Analytics & Reports',
      desc: 'Track daily sales, order pipelines, top-selling SKUs, and exportable financial reports.',
    },
  ];

  return (
    <section id="features" className="py-20 px-6 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Built For Growth
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything You Need To Run a Multi-Million Store
          </h2>
          <p className="text-slate-600 text-base">
            Engineered specifically for the Bangladeshi market with modern software architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="solid-card p-6 rounded-2xl space-y-4">
                <div className={`p-3 w-fit rounded-xl border ${item.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
