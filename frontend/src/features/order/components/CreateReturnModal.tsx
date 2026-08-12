import React, { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Order, useCreateReturnMutation } from '../api/orderApi';
import { toast } from 'react-hot-toast';

interface CreateReturnModalProps {
  order: Order;
  onClose: () => void;
}

export function CreateReturnModal({ order, onClose }: CreateReturnModalProps) {
  const [createReturn, { isLoading }] = useCreateReturnMutation();
  
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; reason: string }>>({});
  const [note, setNote] = useState('');

  const returnableItems = order.items.filter(i => true); // In a real app, verify item return window

  const handleToggleItem = (itemId: string) => {
    if (selectedItems[itemId]) {
      const newItems = { ...selectedItems };
      delete newItems[itemId];
      setSelectedItems(newItems);
    } else {
      const item = order.items.find(i => i.id === itemId);
      if (item) {
        setSelectedItems({
          ...selectedItems,
          [itemId]: { quantity: 1, reason: 'Changed mind' },
        });
      }
    }
  };

  const handleUpdateItem = (itemId: string, field: 'quantity' | 'reason', value: any) => {
    if (selectedItems[itemId]) {
      setSelectedItems({
        ...selectedItems,
        [itemId]: { ...selectedItems[itemId], [field]: value },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemsToReturn = Object.entries(selectedItems).map(([orderItemId, data]) => ({
      orderItemId,
      quantity: Number(data.quantity),
      reason: data.reason,
    }));

    if (itemsToReturn.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }

    try {
      await createReturn({ orderId: order.id, items: itemsToReturn, note }).unwrap();
      toast.success('Return requested successfully');
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create return');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Create Return Request</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Select Items to Return</h3>
            
            {returnableItems.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm text-slate-500">
                No returnable items found in this order.
              </div>
            ) : (
              <div className="space-y-3">
                {returnableItems.map((item) => {
                  const isSelected = !!selectedItems[item.id];
                  
                  return (
                    <div key={item.id} className={`border rounded-xl p-4 transition-colors ${isSelected ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(item.id)}
                          className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{item.productTitle}</p>
                          <p className="text-xs text-slate-500 mb-3">Purchased: {item.quantity} × ৳{Number(item.unitPrice).toLocaleString()}</p>
                          
                          {isSelected && (
                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-indigo-100">
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Return Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  max={item.quantity}
                                  value={selectedItems[item.id].quantity}
                                  onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                                <select
                                  value={selectedItems[item.id].reason}
                                  onChange={(e) => handleUpdateItem(item.id, 'reason', e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                >
                                  <option value="Changed mind">Changed mind</option>
                                  <option value="Damaged">Damaged</option>
                                  <option value="Defective">Defective</option>
                                  <option value="Wrong item">Wrong item</option>
                                  <option value="Wrong size">Wrong size</option>
                                  <option value="Not as described">Not as described</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Additional Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide any additional context for this return..."
              className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white min-h-[80px]"
            />
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-slate-700 text-sm font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || Object.keys(selectedItems).length === 0}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Create Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
