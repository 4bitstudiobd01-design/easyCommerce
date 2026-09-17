'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import { RootState } from '@/store';
import { useGetStoreBySlugQuery } from '@/features/tenant/api/tenantApi';
import { useGetMyProfileQuery, useUpdateMyProfileMutation } from '@/features/storefront/api/customerAccountApi';
import { updateCustomerProfile } from '@/features/storefront/slices/customerAuthSlice';
import { ShopEaseNavbar } from '@/features/storefront/components/ShopEaseNavbar';
import { CartDrawer } from '@/features/storefront/components/CartDrawer';
import { User, Mail, Phone, Pencil, Loader2, Check, X, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerAccountPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const dispatch = useDispatch();
  const router = useRouter();

  const { data: store } = useGetStoreBySlugQuery(slug, { skip: !slug });
  const primaryColor = store?.primaryColor || '#2563eb';

  const isAuthenticated = useSelector((s: RootState) => s.customerAuth.isAuthenticated);
  const storedCustomer = useSelector((s: RootState) => s.customerAuth.customer);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/store/${slug}`);
    }
  }, [isAuthenticated, slug, router]);

  const { data: profile, isLoading } = useGetMyProfileQuery({ storeSlug: slug }, { skip: !slug || !isAuthenticated });
  const [updateMyProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const current = profile || storedCustomer;

  useEffect(() => {
    if (current) {
      setFirstName(current.firstName || '');
      setLastName(current.lastName || '');
      setEmail(current.email || '');
      setPhone(current.phone || '');
    }
  }, [current?.id]);

  if (!isAuthenticated) return null;

  const startEdit = () => {
    if (current) {
      setFirstName(current.firstName || '');
      setLastName(current.lastName || '');
      setEmail(current.email || '');
      setPhone(current.phone || '');
    }
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateMyProfile({
        storeSlug: slug,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      }).unwrap();
      dispatch(updateCustomerProfile(updated));
      toast.success('Profile updated.');
      setIsEditing(false);
    } catch (err: any) {
      const msg = err?.data?.message
        ? Array.isArray(err.data.message) ? err.data.message[0] : err.data.message
        : 'Failed to update profile.';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <CartDrawer primaryColor={primaryColor} />
      <ShopEaseNavbar
        storeName={store?.name || 'Storefront'}
        slug={slug}
        category={store?.category}
        primaryColor={primaryColor}
        logo={store?.logo}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <Link
          href={`/store/${slug}`}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
        >
          <span>← Back to {store?.name || 'Store'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/store/${slug}/account`}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200/80 shadow-sm"
            style={{ color: primaryColor }}
          >
            Profile
          </Link>
          <Link
            href={`/store/${slug}/account/orders`}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
          >
            My Orders
          </Link>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-7">
          <div className="flex items-center justify-between gap-3 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                style={{ backgroundColor: primaryColor, boxShadow: `0 8px 20px -6px ${primaryColor}66` }}
              >
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">My Profile</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  View and update your account details.
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={startEdit}
                className="h-10 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
          </div>

          {isLoading && !current ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-4 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-transparent rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-12 text-white text-sm font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 10px 24px -8px ${primaryColor}80` }}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="h-12 px-5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1 divide-y divide-slate-100">
              <div className="flex items-center gap-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Name</span>
                  <span className="text-sm font-bold text-slate-900">
                    {current ? `${current.firstName} ${current.lastName}`.trim() : '—'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Email</span>
                  <span className="text-sm font-bold text-slate-900">{current?.email || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone</span>
                  <span className="text-sm font-bold text-slate-900">{current?.phone || '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Link
          href={`/store/${slug}/account/orders`}
          className="bg-white rounded-[28px] border border-slate-200/80 shadow-sm p-6 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">View your orders</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">See order status, courier tracking and history.</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors shrink-0">→</span>
        </Link>
      </main>
    </div>
  );
}
