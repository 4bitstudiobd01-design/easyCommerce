'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import { useRouter } from 'next/navigation';
import { Store, LogOut, ShieldCheck, UserCheck, Layers, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Solid Header */}
      <header className="px-8 py-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg leading-none text-slate-900 tracking-tight">EasyCommerce Admin</h1>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Live</span>
            </div>
            <span className="text-xs text-blue-600 font-semibold mt-0.5 block">Merchant Control Center</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {user && (
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-tight">{user.fullName || user.email}</p>
              <p className="text-xs text-slate-500 capitalize font-medium">{user.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border border-slate-200 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Welcome Card */}
        <div className="p-8 solid-card rounded-2xl border-l-4 border-l-blue-600">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Sprint 0 Vertical Slice Active</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome to your Merchant Control Center!
            </h2>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">
              Your store authentication & identity vertical slice is live. Verified with JWT tokens, Redux Toolkit state, and PostgreSQL tenant isolation.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2.5 bg-emerald-50 w-fit rounded-xl border border-emerald-100 text-emerald-600 mb-3">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Logged In Account</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{user?.email || 'merchant@easycommerce.com'}</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2.5 bg-blue-50 w-fit rounded-xl border border-blue-100 text-blue-600 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Assigned RBAC Role</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{user?.role || 'STORE_OWNER'}</p>
            </div>

            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2.5 bg-indigo-50 w-fit rounded-xl border border-indigo-100 text-indigo-600 mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Active Stack</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">Feature UI + RTK Query</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
