'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/store';
import {
  toggleCartDrawer,
  updateQuantity,
  removeFromCart,
  clearCart,
} from '../slices/cartSlice';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon,
} from 'lucide-react';

export function CartDrawer() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { items, isDrawerOpen } = useSelector((state: RootState) => state.cart);

  if (!isDrawerOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleProceedToCheckout = () => {
    dispatch(toggleCartDrawer(false));
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={() => dispatch(toggleCartDrawer(false))}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-900">Your Cart</h2>
                <p className="text-xs text-slate-500">{items.length} items in cart</p>
              </div>
            </div>
            <button
              onClick={() => dispatch(toggleCartDrawer(false))}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Item List Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500 mt-1">Browse products and add items to your cart.</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.productId}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.title}</h4>
                    <p className="text-xs font-extrabold text-blue-600 mt-0.5">৳{item.price.toLocaleString()}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          className="p-1 hover:bg-slate-100 text-slate-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          className="p-1 hover:bg-slate-100 text-slate-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => dispatch(removeFromCart(item.productId))}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-slate-50/50 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Estimated Delivery</span>
                  <span className="font-bold text-emerald-600">Calculated at Checkout</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-sm text-slate-900">
                  <span>Total</span>
                  <span className="text-blue-600">৳{subtotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>bKash, Nagad & Cash on Delivery Available</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
