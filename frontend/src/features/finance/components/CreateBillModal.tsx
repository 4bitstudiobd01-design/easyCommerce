'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useCreateBillMutation } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface BillLineItem {
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export function CreateBillModal({ isOpen, onClose }: Props) {
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [category, setCategory] = useState('COGS');
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<BillLineItem[]>([
    { title: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);

  const [createBill, { isLoading }] = useCreateBillMutation();

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { title: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('A bill must have at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof BillLineItem,
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
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      toast.error('Please enter supplier name.');
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
      await createBill({
        supplierName,
        supplierContact: supplierContact || undefined,
        supplierEmail: supplierEmail || undefined,
        category,
        issueDate,
        dueDate,
        notes: notes || undefined,
        items: items.map((item) => ({
          title: item.title,
          description: item.description || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
      }).unwrap();

      toast.success('Supplier bill recorded successfully.');
      onClose();
      // Reset form
      setSupplierName('');
      setSupplierContact('');
      setSupplierEmail('');
      setItems([{ title: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }]);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to record bill.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Supplier Bill"
      subtitle="Log incoming invoice or bill from a vendor/supplier"
      icon={<Receipt className="w-5 h-5" />}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        {/* Supplier Information */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase">Supplier / Vendor Info</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Supplier Name *
              </label>
              <input
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Dhaka Packaging Ltd"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone / Contact</label>
              <input
                type="text"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                placeholder="+880 1800-000000"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expense Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="COGS">Cost of Goods Sold (COGS)</option>
                <option value="MARKETING">Marketing & Advertising</option>
                <option value="SHIPPING">Shipping & Packaging</option>
                <option value="RENT">Rent & Facilities</option>
                <option value="UTILITIES">Utilities</option>
                <option value="SOFTWARE">Software & Tools</option>
                <option value="OTHER">Other Operating Expense</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Bill Date *
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
              Bill Items
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
                    placeholder="Item name / SKU *"
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

        {/* Totals */}
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
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-base">
              <span>Total Bill:</span>
              <span className="font-mono text-rose-600">৳{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Notes / Reference
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Vendor invoice number or purchase order reference..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
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
            {isLoading ? 'Saving...' : 'Record Bill'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
