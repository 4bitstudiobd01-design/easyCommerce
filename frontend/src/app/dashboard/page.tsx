'use client';

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout } from '@/features/auth/slices/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { useGetProductsQuery, useGetCategoriesQuery } from '@/features/catalog/api/catalogApi';
import { useGetMerchantOrdersQuery, Order } from '@/features/order/api/orderApi';
import { CreateStoreModal } from '@/features/tenant/components/CreateStoreModal';
import { CreateProductModal } from '@/features/catalog/components/CreateProductModal';
import { ProductListTable } from '@/features/catalog/components/ProductListTable';
import { AdjustStockModal } from '@/features/inventory/components/AdjustStockModal';
import { InventoryStockTable } from '@/features/inventory/components/InventoryStockTable';
import { OrderListTable } from '@/features/order/components/OrderListTable';
import { RevenueChart } from '@/features/analytics/components/RevenueChart';
import { TopProductsCard } from '@/features/analytics/components/TopProductsCard';
import { BookCourierModal } from '@/features/logistics/components/BookCourierModal';
import { ConsignmentListTable } from '@/features/logistics/components/ConsignmentListTable';
import { StoreSettingsForm } from '@/features/tenant/components/StoreSettingsForm';
import { SmsLogsTable } from '@/features/sms/components/SmsLogsTable';
import { NotificationBellDrawer } from '@/features/sms/components/NotificationBellDrawer';
import { CouponManagementTable } from '@/features/coupon/components/CouponManagementTable';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ShoppingCart,
  Users,
  Settings,
  MessageSquare,
  Tag,
  LogOut,
  Search,
  Bell,
  Plus,
  ExternalLink,
  TrendingUp,
  DollarSign,
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Store as StoreIcon,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Layers,
  Globe,
  Boxes,
  SlidersHorizontal,
  FileText,
  UserCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'logistics' | 'inventory' | 'sms' | 'coupons' | 'customers' | 'settings'>('overview');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [selectedProductIdForStock, setSelectedProductIdForStock] = useState<string | undefined>(undefined);

  const [selectedOrderForCourier, setSelectedOrderForCourier] = useState<Order | null>(null);
  const [isBookCourierModalOpen, setIsBookCourierModalOpen] = useState(false);

  useEffect(() => {
    if (!token && !isAuthenticated) {
      router.push('/login');
    }
  }, [token, isAuthenticated, router]);

  const {
    data: store,
    isLoading: isStoreLoading,
    isFetching: isStoreFetching,
    isSuccess: isStoreSuccess,
    refetch: refetchStore,
  } = useGetMyStoreQuery();

  const { data: products = [] } = useGetProductsQuery(undefined, {
    skip: !store,
  });

  const { data: categories = [] } = useGetCategoriesQuery(undefined, {
    skip: !store,
  });

  const { data: orders = [], refetch: refetchOrders } = useGetMerchantOrdersQuery(undefined, {
    skip: !store,
  });

  const totalSales = orders.reduce((acc, order) => acc + Number(order.grandTotal), 0);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const handleOpenStockModal = (prodId?: string) => {
    setSelectedProductIdForStock(prodId);
    setIsAdjustStockModalOpen(true);
  };

  const handleOpenCourierModal = (order: Order) => {
    setSelectedOrderForCourier(order);
    setIsBookCourierModalOpen(true);
  };

  const showOnboardingModal = Boolean(user?.role !== 'SUPER_ADMIN' && isStoreSuccess && !isStoreLoading && !isStoreFetching && !store);

  return (
    <div className="min-h-screen bg-slate-900/5 text-slate-900 flex font-sans">
      {/* Onboarding Store Creation Modal */}
      <CreateStoreModal
        isOpen={showOnboardingModal}
        onSuccess={() => refetchStore()}
      />

      {/* Add Product Modal */}
      <CreateProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={isAdjustStockModalOpen}
        onClose={() => setIsAdjustStockModalOpen(false)}
        initialProductId={selectedProductIdForStock}
      />

      {/* Book Courier Modal */}
      <BookCourierModal
        order={selectedOrderForCourier}
        isOpen={isBookCourierModalOpen}
        onClose={() => setIsBookCourierModalOpen(false)}
        onSuccess={() => refetchOrders()}
      />

      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block leading-none">
                EasyCommerce
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mt-1">
                Merchant Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Active Store Switcher */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                {store?.name ? store.name[0].toUpperCase() : 'S'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">
                  {store?.name || 'No Active Store'}
                </p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="truncate">{store?.slug ? `${store.slug}.easycommerce.app` : 'Setting up...'}</span>
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>

        {/* Navigation Section Links */}
        <nav className="flex-1 p-4 space-y-1 text-xs font-semibold">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Main Menu
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>Products & Catalog</span>
            </div>
            {products.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full">
                {products.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4" />
              <span>Orders & Sales</span>
            </div>
            {orders.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('logistics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'logistics'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Logistics & Shipments</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Inventory Control</span>
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'sms'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>SMS Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'coupons'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Promo Coupons</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers</span>
          </button>

          <div className="px-3 py-2 pt-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Settings & Setup
          </div>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.fullName ? user.fullName[0].toUpperCase() : 'M'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Merchant Account'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'merchant@easycommerce.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-40">
          {/* Search Input */}
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-4">
            {store && (
              <Link
                href={`/store/${store.slug}`}
                target="_blank"
                className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200/80 flex items-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Visit {store.name}</span>
              </Link>
            )}

            <NotificationBellDrawer />

            <div className="h-6 w-px bg-slate-200"></div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tenant ID: {store?.tenantId?.slice(0, 8) || 'Isolated'}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Body Container */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Welcome Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-8 border border-slate-800 shadow-xl">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/30 via-transparent to-transparent pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-bold mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>Welcome Back, {user?.fullName || 'Store Owner'}!</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                      {store?.name ? `${store.name} Control Center` : 'Merchant Control Center'}
                    </h1>
                    <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                      Your store is live on <span className="text-blue-400 font-semibold">{store?.slug ? `${store.slug}.easycommerce.app` : 'EasyCommerce'}</span>. Manage catalog items, orders, and multi-tenant settings in real-time.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setIsProductModalOpen(true)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Revenue */}
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Sales</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">৳{totalSales.toLocaleString()}</span>
                    <span className="text-xs font-bold text-emerald-600">Revenue</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Currency: {store?.currency || 'BDT (৳)'}</p>
                </div>

                {/* Card 2: Orders */}
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Orders</span>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">{orders.length}</span>
                    <span className="text-xs font-bold text-blue-600">Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Completed & pending purchases</p>
                </div>

                {/* Card 3: Active Products */}
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Products</span>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">{products.length}</span>
                    <span className="text-xs font-bold text-indigo-600">Catalog</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Decoupled stock modeling</p>
                </div>

                {/* Card 4: Store Customers */}
                <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Store Customers</span>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900">{orders.length > 0 ? new Set(orders.map(o => o.customerPhone)).size : 0}</span>
                    <span className="text-xs font-bold text-emerald-600">Isolated</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Row-level security context</p>
                </div>
              </div>

              {/* 7-Day Revenue Trend Chart & Top Selling Products Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  <RevenueChart />
                </div>
                <div className="lg:col-span-4">
                  <TopProductsCard />
                </div>
              </div>

              {/* Product List Table Section */}
              <div className="space-y-4">
                <ProductListTable onAddProductClick={() => setIsProductModalOpen(true)} />
              </div>
            </>
          )}

          {/* TAB 2: PRODUCTS & CATALOG */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Products & Catalog Management</h1>
                  <p className="text-xs text-slate-500 mt-1">Manage product titles, categories, pricing, SKUs, and images for {store?.name}.</p>
                </div>

                <button
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Product</span>
                </button>
              </div>

              {/* Categories Pills */}
              {categories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories:</span>
                  {categories.map((cat) => (
                    <span key={cat.id} className="px-3 py-1 bg-white border border-slate-200 text-slate-800 font-bold text-xs rounded-full shadow-sm">
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              <ProductListTable onAddProductClick={() => setIsProductModalOpen(true)} />
            </div>
          )}

          {/* TAB 3: ORDERS & SALES */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Orders & Sales Pipeline</h1>
                <p className="text-xs text-slate-500 mt-1">Track storefront purchases, customer invoices, and order statuses for {store?.name}.</p>
              </div>

              <OrderListTable onDispatchCourierClick={(order) => handleOpenCourierModal(order)} />
            </div>
          )}

          {/* TAB 4: LOGISTICS & SHIPMENTS */}
          {activeTab === 'logistics' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Logistics & Parcel Shipments</h1>
                <p className="text-xs text-slate-500 mt-1">Manage Steadfast & Pathao courier parcel bookings, waybill tracking, and COD collections for {store?.name}.</p>
              </div>

              <ConsignmentListTable />
            </div>
          )}

          {/* TAB 5: INVENTORY CONTROL */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Decoupled Inventory Control</h1>
                  <p className="text-xs text-slate-500 mt-1">Multi-warehouse physical stock tracking, allocations, and reorder alerts for {store?.name}.</p>
                </div>

                <button
                  onClick={() => handleOpenStockModal()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Adjust Stock</span>
                </button>
              </div>

              <InventoryStockTable onAdjustStockClick={(prodId) => handleOpenStockModal(prodId)} />
            </div>
          )}

          {/* TAB 6: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Store Customers Directory</h1>
                <p className="text-xs text-slate-500 mt-1">Row-level isolated customer profiles for {store?.name}.</p>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-8">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">No Customers Registered Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    As buyers place orders on your storefront, their customer profiles will be saved here automatically.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                  <h3 className="font-bold text-base text-slate-900 mb-4">Customer Directory</h3>
                  <div className="divide-y divide-slate-100">
                    {Array.from(new Set(orders.map((o) => o.customerPhone))).map((phone) => {
                      const custOrder = orders.find((o) => o.customerPhone === phone);
                      return (
                        <div key={phone} className="py-3 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{custOrder?.customerName}</span>
                            <span className="text-xs text-slate-500">{phone} • {custOrder?.shippingAddress}</span>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                            Active Buyer
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SMS ALERTS */}
          {activeTab === 'sms' && <SmsLogsTable />}

          {/* TAB 7: PROMO COUPONS */}
          {activeTab === 'coupons' && <CouponManagementTable />}

          {/* TAB 8: STORE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Store Settings & Configuration</h1>
                <p className="text-xs text-slate-500 mt-1">Configure tenant properties, currency, phone number, and courier API keys.</p>
              </div>

              <StoreSettingsForm store={store || null} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
