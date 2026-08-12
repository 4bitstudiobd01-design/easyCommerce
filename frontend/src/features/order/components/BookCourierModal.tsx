import React, { useState } from 'react';
import { X, Truck, Loader2 } from 'lucide-react';
import { useBookCourierMutation } from '../../logistics/api/logisticsApi';
import { orderApi } from '../api/orderApi';
import { useDispatch } from 'react-redux';

interface BookCourierModalProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  paymentMethod: string;
  paymentStatus: string;
  grandTotal: number;
  onClose: () => void;
}

export function BookCourierModal({
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  shippingAddress,
  city,
  paymentMethod,
  paymentStatus,
  grandTotal,
  onClose
}: BookCourierModalProps) {
  const dispatch = useDispatch();
  const [bookCourier, { isLoading }] = useBookCourierMutation();
  const [provider, setProvider] = useState<'STEADFAST' | 'PATHAO' | 'PAPERFLY'>('STEADFAST');
  const [note, setNote] = useState('');
  
  const codAmount = paymentStatus === 'PAID' ? 0 : grandTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bookCourier({
        orderId,
        courierProvider: provider,
        note
      }).unwrap();
      
      // Invalidate order cache to refresh timeline and consignment block
      dispatch(orderApi.util.invalidateTags([{ type: 'Order', id: orderId }]));
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.data?.message || 'Failed to book courier. Check your store courier settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Book Courier</h3>
              <p className="text-xs font-medium text-slate-500">Order #{orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Courier Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Select Courier</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`border rounded-xl p-3 cursor-pointer flex flex-col items-center gap-2 transition-all ${provider === 'STEADFAST' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="provider" value="STEADFAST" className="sr-only" checked={provider === 'STEADFAST'} onChange={() => setProvider('STEADFAST')} />
                  <span className="font-bold text-sm text-slate-900">Steadfast</span>
                </label>
                <label className={`border rounded-xl p-3 cursor-pointer flex flex-col items-center gap-2 transition-all ${provider === 'PATHAO' ? 'border-red-600 bg-red-50 ring-1 ring-red-600' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="radio" name="provider" value="PATHAO" className="sr-only" checked={provider === 'PATHAO'} onChange={() => setProvider('PATHAO')} />
                  <span className="font-bold text-sm text-slate-900">Pathao</span>
                </label>
              </div>
            </div>

            {/* Recipient Details (Readonly) */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Recipient</span>
                <p className="text-sm font-bold text-slate-900">{customerName}</p>
                <p className="text-xs font-medium text-slate-500">{customerPhone}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery Address</span>
                <p className="text-sm font-medium text-slate-700 leading-tight">{shippingAddress}, {city}</p>
              </div>
            </div>

            {/* COD Amount */}
            <div className={`rounded-xl border p-4 flex justify-between items-center ${codAmount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div>
                <span className={`text-[10px] font-bold uppercase ${codAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>COD Amount</span>
                <p className="text-sm font-bold text-slate-900">{paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}</p>
              </div>
              <p className="text-2xl font-black text-slate-900">৳{codAmount.toLocaleString()}</p>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Package / Instructions (Optional)</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Fragile, call before delivery..."
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none min-h-[80px]"
              />
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2.5 bg-white text-slate-700 text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : 'Book Courier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
