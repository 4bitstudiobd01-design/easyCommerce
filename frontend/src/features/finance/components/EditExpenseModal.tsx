'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Edit3,
  Paperclip,
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  useUpdateExpenseMutation,
  useUploadReceiptFileMutation,
  useGetAccountsQuery,
  useGetCategoriesQuery,
  FinanceCategory,
  FinanceAccount,
  FinanceTransaction,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  expense: FinanceTransaction | null;
}

export function EditExpenseModal({ isOpen, onClose, expense }: Props) {
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [categoryCode, setCategoryCode] = useState('MARKETING');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Receipt File Attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<{
    id: string;
    url: string;
    fileName?: string;
    mimeType?: string;
  } | null>(null);
  const [uploadedReceiptId, setUploadedReceiptId] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: accountsData } = useGetAccountsQuery();
  const { data: categories } = useGetCategoriesQuery({ type: 'EXPENSE' });
  const [updateExpense, { isLoading }] = useUpdateExpenseMutation();
  const [uploadReceipt] = useUploadReceiptFileMutation();

  const rawAccounts = (accountsData as any)?.data !== undefined ? (accountsData as any).data : accountsData;
  const accounts: FinanceAccount[] = Array.isArray(rawAccounts)
    ? rawAccounts
    : (rawAccounts as any)?.items || [];
  const categoryList: FinanceCategory[] = Array.isArray(categories) ? categories : [];

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount || ''));
      setTransactionDate(
        expense.transactionDate ? String(expense.transactionDate).split('T')[0] : new Date().toISOString().split('T')[0],
      );
      setCategoryCode(expense.categoryCode || expense.category?.code || 'MARKETING');
      setAccountId(expense.accountId || '');
      setDescription(expense.description || '');
      setReference(expense.reference || '');
      setPaymentMethod(expense.paymentMethod || 'CASH');

      if (expense.receiptFile) {
        setExistingReceipt(expense.receiptFile);
        setUploadedReceiptId(expense.receiptFile.id);
        if (expense.receiptFile.mimeType?.startsWith('image/') || expense.receiptFile.url.match(/\.(jpeg|jpg|png|webp|gif)$/i)) {
          setPreviewUrl(expense.receiptFile.url);
        }
      } else if (expense.receiptFileId) {
        setUploadedReceiptId(expense.receiptFileId);
      } else {
        setExistingReceipt(null);
        setUploadedReceiptId(null);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
    }
  }, [expense]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }

    setIsUploadingFile(true);
    try {
      const res = await uploadReceipt({ file }).unwrap();
      setUploadedReceiptId(res.id);
      setExistingReceipt({
        id: res.id,
        url: res.url,
        fileName: res.fileName,
        mimeType: res.mimeType,
      });
      toast.success('New voucher / receipt file attached.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to upload receipt file.');
      setSelectedFile(null);
      setPreviewUrl(null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExistingReceipt(null);
    setUploadedReceiptId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      await updateExpense({
        id: expense.id,
        amount: numAmount,
        transactionDate,
        categoryCode,
        accountId: accountId || undefined,
        description: description || undefined,
        reference: reference || undefined,
        paymentMethod: paymentMethod || undefined,
        receiptFileId: uploadedReceiptId || undefined,
      }).unwrap();

      toast.success(`Expense ${expense.transactionNumber} updated successfully.`);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update expense.');
    }
  };

  if (!expense) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Expense (${expense.transactionNumber})`}
      subtitle="Modify expense details and adjust financial ledger (Admin Access)"
      icon={<Edit3 className="w-5 h-5 text-blue-600" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Amount (BDT) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Expense Category *
            </label>
            <select
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="COGS">Cost of Goods Sold (COGS)</option>
              <option value="MARKETING">Marketing & Advertising</option>
              <option value="SHIPPING">Shipping & Logistics</option>
              <option value="SALARY">Salary & Wages</option>
              <option value="EMPLOYEE_EXPENSE">Employee Expenses</option>
              <option value="RENT">Rent & Office</option>
              <option value="UTILITIES">Utilities</option>
              <option value="EQUIPMENT">Equipment & Tools</option>
              <option value="PACKAGING">Packaging & Supplies</option>
              <option value="SOFTWARE">Software & Cloud</option>
              <option value="OFFICE_ADMIN">Office Admin</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other Expenses</option>
              {categoryList
                .filter(
                  (c) =>
                    ![
                      'COGS',
                      'MARKETING',
                      'SHIPPING',
                      'SALARY',
                      'EMPLOYEE_EXPENSE',
                      'RENT',
                      'UTILITIES',
                      'EQUIPMENT',
                      'PACKAGING',
                      'SOFTWARE',
                      'OFFICE_ADMIN',
                      'MAINTENANCE',
                      'OTHER',
                    ].includes(c.code),
                )
                .map((cat) => (
                  <option key={cat.id} value={cat.code}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Paid From Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">-- Direct / Cash / Petty Cash --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency} {Number(acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="CASH">Cash</option>
              <option value="BANK">Bank Transfer / Card</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reference / Bill #
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Receipt #482, Voucher #11"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Expense reason or vendor info..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Attachment Upload / Replacement Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
              Receipt / Proof Attachment (Image or PDF)
            </span>
            <span className="text-[10px] font-normal text-slate-400">JPG, PNG, PDF up to 10MB</span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {!existingReceipt && !selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-white text-slate-400 group-hover:text-blue-600 shadow-2xs border border-slate-100 flex items-center justify-center transition">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                Click to upload or replace receipt voucher
              </p>
              <p className="text-[10px] text-slate-400">Images (JPG, PNG) or PDF Document</p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedFile?.name || existingReceipt?.fileName || 'Attached Receipt File'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isUploadingFile ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading file...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Attached
                      </span>
                    )}
                    {existingReceipt?.url && (
                      <a
                        href={existingReceipt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        <span>View</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                  title="Remove attached file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || isUploadingFile}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            {isLoading ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
