import Link from 'next/link';
import { Store, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white text-slate-600 py-16 px-6 border-t border-slate-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Column */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-600/20">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">EasyCommerce</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 font-normal">
            Enterprise-grade multi-tenant eCommerce SaaS platform designed for Bangladesh first, scaling globally.
          </p>
        </div>

        {/* Product Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Product & Company</h4>
          <ul className="space-y-2 text-xs font-semibold">
            <li><Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link></li>
            <li><a href="#features" className="hover:text-blue-600 transition-colors">Platform Features</a></li>
            <li><a href="#pricing" className="hover:text-blue-600 transition-colors">BDT Pricing</a></li>
            <li><Link href="/register" className="hover:text-blue-600 transition-colors">Merchant Registration</Link></li>
          </ul>
        </div>

        {/* Local Ecosystem */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Integrations</h4>
          <ul className="space-y-2 text-xs font-semibold">
            <li><span className="text-slate-700">bKash & Nagad Direct API</span></li>
            <li><span className="text-slate-700">Steadfast & Pathao Courier</span></li>
            <li><span className="text-slate-700">SSLCommerz Payment Gateway</span></li>
            <li><span className="text-slate-700">Facebook Pixel & GTM</span></li>
          </ul>
        </div>

        {/* Legal & Security */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal & Security</h4>
          <ul className="space-y-2 text-xs font-semibold">
            <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Multi-Tenant Isolation</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Security Statement</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-10 mt-12 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
        <p>© {new Date().getFullYear()} EasyCommerce Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          <span>Engineered with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span>for Bangladesh</span>
        </p>
      </div>
    </footer>
  );
}
