'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCreateInvoiceMutation } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface LineItem {
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export function CreateInvoiceModal({ isOpen, onClose }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment due within 14 days of issue.');

  const [items, setItems] = useState<LineItem[]>([
    { title: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);

  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { title: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('An invoice must have at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  );
  const taxAmount = items.reduce(
    (sum, item) =>
      sum + (item.quantity || 0) * (item.unitPrice || 0) * ((item.taxRate || 0) / 100),
    0,
  );
  const discount = Number(discountAmount) || 0;
  const totalAmount = Math.max(0, subtotal + taxAmount - discount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Please enter customer name.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].title.trim()) {
        toast.error(`Please provide a title for line item #${i + 1}.`);
        return;
      }
      if (items[i].unitPrice <= 0) {
        toast.error(`Unit price for item #${i + 1} must be greater than 0.`);
        return;
      }
    }

    try {
      await createInvoice({
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        customerAddress: customerAddress || undefined,
        issueDate,
        dueDate,
        discountAmount: discount,
        notes: notes || undefined,
        terms: terms || undefined,
        items: items.map((item) => ({
          title: item.title,
          description: item.description || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
      }).unwrap();

      toast.success('Invoice created successfully.');
      onClose();
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerAddress('');
      setItems([{ title: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create invoice.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Customer Invoice"
      subtitle="Issue an invoice to a customer or business client"
      icon={<FileText className="w-5 h-5" />}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Customer Information */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase">Customer Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Customer / Company Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Acme Corp / Rahim Ahmed"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+880 1700-000000"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Billing Address</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="House, Road, City"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Issue Date *
            </label>
            <input
              type="date"
              required
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Line Items
            </h4>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center"
              >
                <div className="col-span-4">
                  <input
                    type="text"
                    required
                    placeholder="Item title *"
                    value={item.title}
                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Description (opt)"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, 'quantity', Math.max(1, Number(e.target.value)))
                    }
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Price"
                    value={item.unitPrice || ''}
                    onChange={(e) =>
                      handleItemChange(index, 'unitPrice', Number(e.target.value))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-right font-mono"
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Tax%"
                    value={item.taxRate || ''}
                    onChange={(e) =>
                      handleItemChange(index, 'taxRate', Number(e.target.value))
                    }
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Calculation */}
        <div className="flex justify-end">
          <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono">৳{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax / VAT:</span>
              <span className="font-mono">৳{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Discount:</span>
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-right font-mono text-xs"
              />
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-base">
              <span>Total Amount:</span>
              <span className="font-mono text-blue-600">৳{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment instructions or client notes..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Terms & Conditions
            </label>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition"
          >
            {isLoading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
