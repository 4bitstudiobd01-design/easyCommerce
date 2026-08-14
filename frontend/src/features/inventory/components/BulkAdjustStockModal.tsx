'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Plus,
  Minus,
  Equal,
  CheckCircle2,
  FileText,
  MessageSquare,
  Package,
} from 'lucide-react';
import { InventoryListItem, useAdjustStockMutation } from '../api/inventoryApi';
import { toast } from 'sonner';

interface BulkAdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: InventoryListItem[];
  onSuccess?: () => void;
}

export function BulkAdjustStockModal({
  isOpen,
  onClose,
  selectedItems,
  onSuccess,
}: BulkAdjustStockModalProps) {
  const [action, setAction] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [quantityStr, setQuantityStr] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  
  // Step 1: Select Items (done before opening)
  // Step 2: Choose Action
  // Step 3: Review & Confirm
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [adjustStock] = useAdjustStockMutation();

  if (!isOpen) return null;

  const parsedQty = parseInt(quantityStr, 10);
  const isValidQty = !isNaN(parsedQty) && parsedQty > 0;
  
  const canProceedToReview = isValidQty && reason.trim().length > 0;

  const handleConfirm = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const promises = selectedItems.map((item) =>
        adjustStock({
          inventoryId: item.id,
          action,
          quantity: parsedQty,
          reason,
          reference: reference || undefined,
        }).unwrap()
      );

      await Promise.all(promises);
      toast.success(`Successfully adjusted stock for ${selectedItems.length} items`);
      onSuccess?.();
    } catch (error: any) {
      setErrorMessage(error?.data?.message || error?.message || 'Bulk adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Stepper */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white shrink-0 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Bulk Inventory Operations</h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
              <span className="text-sm font-semibold text-slate-900">1. Select Items</span>
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2</div>
              <span className={`text-sm font-semibold ${currentStep >= 2 ? 'text-blue-600' : 'text-slate-500'}`}>Choose Action</span>
            </div>
            <div className="w-8 h-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>3</div>
              <span className={`text-sm font-semibold ${currentStep === 3 ? 'text-blue-600' : 'text-slate-500'}`}>Review & Confirm</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Selected Items */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selected Items ({selectedItems.length} selected)</h3>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                  {selectedItems.map(item => (
                    <div key={item.id} className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                         <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.sku} {item.variantTitle && `• ${item.variantTitle}`}</p>
                      </div>
                      <div className="ml-auto text-right shrink-0">
                         <p className="text-xs font-extrabold text-slate-700">{item.quantityOnHand}</p>
                         <p className="text-[9px] text-slate-400">Stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Action Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                
                {currentStep === 2 && (
                  <>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bulk Action</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setAction('ADD')}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                          action === 'ADD' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                           <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><Plus className="w-4 h-4"/></div>
                           {action === 'ADD' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Add Stock</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Increase units</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAction('REMOVE')}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                          action === 'REMOVE' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                           <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center"><Minus className="w-4 h-4"/></div>
                           {action === 'REMOVE' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Remove Stock</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Decrease units</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAction('SET')}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                          action === 'SET' ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/30' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                           <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Equal className="w-4 h-4"/></div>
                           {action === 'SET' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Set Stock</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Override units</p>
                        </div>
                      </button>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Quantity to {action.toLowerCase()} *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantityStr}
                          onChange={(e) => setQuantityStr(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                          placeholder="e.g. 50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Reason *
                          </label>
                          <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                          >
                            <option value="">Select a reason...</option>
                            <option value="Restock Received">Restock Received</option>
                            <option value="Inventory Count Correction">Inventory Count Correction</option>
                            <option value="Damaged/Expired Goods">Damaged/Expired Goods</option>
                            <option value="Returned to Vendor">Returned to Vendor</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" /> Reference (Optional)
                          </label>
                          <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                            placeholder="PO-12345 or Invoice #"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Review Action</h3>
                     
                     <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
                        <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                           <h4 className="text-sm font-bold text-slate-900">You are about to {action.toLowerCase()} {parsedQty} units.</h4>
                           <p className="text-xs text-slate-600 mt-1">This bulk operation will apply to all <strong>{selectedItems.length} selected items</strong> simultaneously.</p>
                           <ul className="mt-3 space-y-1.5 text-xs font-medium text-slate-700">
                              <li>• <strong>Action:</strong> {action}</li>
                              <li>• <strong>Quantity:</strong> {parsedQty}</li>
                              <li>• <strong>Reason:</strong> {reason}</li>
                           </ul>
                        </div>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-white shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-slate-600 text-sm font-bold hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
             {currentStep === 3 && (
               <button
                 type="button"
                 onClick={() => setCurrentStep(2)}
                 disabled={isSubmitting}
                 className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
               >
                 Back
               </button>
             )}
             
             {currentStep === 2 ? (
               <button
                 type="button"
                 onClick={() => setCurrentStep(3)}
                 disabled={!canProceedToReview}
                 className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-purple-600/30"
               >
                 Continue to Review
               </button>
             ) : (
               <button
                 type="button"
                 onClick={handleConfirm}
                 disabled={isSubmitting}
                 className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-blue-600/30 flex items-center gap-2"
               >
                 {isSubmitting ? (
                   <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     <span>Processing...</span>
                   </>
                 ) : (
                   <span>Confirm Bulk Action</span>
                 )}
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
