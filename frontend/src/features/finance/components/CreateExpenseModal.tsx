'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  TrendingDown,
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Loader2,
  Landmark,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import {
  useCreateExpenseMutation,
  useUploadReceiptFileMutation,
  useGetAccountsQuery,
  useGetCategoriesQuery,
  FinanceCategory,
  FinanceAccount,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialAccountId?: string;
}

export function CreateExpenseModal({ isOpen, onClose, initialAccountId }: Props) {
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [categoryCode, setCategoryCode] = useState('MARKETING');
  const [accountId, setAccountId] = useState(initialAccountId || '');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  // Receipt File Attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedReceipt, setUploadedReceipt] = useState<{
    id: string;
    url: string;
    fileName: string;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: accountsData } = useGetAccountsQuery();
  const { data: categories } = useGetCategoriesQuery({ type: 'EXPENSE' });
  const [createExpense, { isLoading }] = useCreateExpenseMutation();
  const [uploadReceipt] = useUploadReceiptFileMutation();

  const rawAccounts = (accountsData as any)?.data !== undefined ? (accountsData as any).data : accountsData;
  const accounts: FinanceAccount[] = Array.isArray(rawAccounts)
    ? rawAccounts
    : (rawAccounts as any)?.items || [];
  const categoryList: FinanceCategory[] = Array.isArray(categories) ? categories : [];

  React.useEffect(() => {
    if (initialAccountId) {
      setAccountId(initialAccountId);
    } else if (accounts.length > 0 && !accountId) {
      const defAcc =
        accounts.find((a) => a.isDefault && a.isActive) ||
        accounts.find((a) => a.isActive) ||
        accounts[0];
      if (defAcc) {
        setAccountId(defAcc.id);
      }
    }
  }, [initialAccountId, accounts, accountId, isOpen]);

  const handleAccountChange = (newAccId: string) => {
    setAccountId(newAccId);
    const selected = accounts.find((a) => a.id === newAccId);
    if (selected) {
      if (selected.type === 'CASH') setPaymentMethod('CASH');
      else if (selected.type === 'DIGITAL_WALLET') {
        const prov = (selected.bankOrProviderName || selected.name || '').toUpperCase();
        if (prov.includes('NAGAD')) setPaymentMethod('NAGAD');
        else setPaymentMethod('BKASH');
      } else if (selected.type === 'PAYMENT_GATEWAY') setPaymentMethod('BANK');
      else setPaymentMethod('BANK');
    }
  };

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currentBal = selectedAccount ? Number(selectedAccount.currentBalance || 0) : 0;
  const expenseAmt = Number(amount || 0);
  const remainingBal = currentBal - expenseAmt;
  const isInsufficient = Boolean(selectedAccount && expenseAmt > 0 && remainingBal < 0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
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

    // Auto upload file
    setIsUploadingFile(true);
    try {
      const res = await uploadReceipt({ file }).unwrap();
      setUploadedReceipt(res);
      toast.success('Voucher / receipt file attached successfully.');
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
    setUploadedReceipt(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      await createExpense({
        amount: numAmount,
        transactionDate,
        categoryCode,
        accountId: accountId || undefined,
        description: description || undefined,
        reference: reference || undefined,
        paymentMethod: paymentMethod || undefined,
        receiptFileId: uploadedReceipt?.id || undefined,
      }).unwrap();

      toast.success('Expense recorded successfully.');
      onClose();
      setAmount('');
      setDescription('');
      setReference('');
      handleRemoveFile();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to record expense.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Expense"
      subtitle="Log business operational cost, invoice or vendor payout with proof"
      icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Expense Category *
            </label>
            <select
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="COGS">Cost of Goods Sold (COGS)</option>
              <option value="MARKETING">Marketing & Advertising</option>
              <option value="SHIPPING">Shipping & Logistics</option>
              <option value="SALARY">Salary & Wages</option>
              <option value="EMPLOYEE_EXPENSE">Employee Expenses</option>
              <option value="RENT">Rent & Office</option>
              <option value="UTILITIES">Utilities & Power</option>
              <option value="EQUIPMENT">Equipment & Racks</option>
              <option value="PACKAGING">Packaging Boxes & Supplies</option>
              <option value="SOFTWARE">Software & Cloud Tools</option>
              <option value="OFFICE_ADMIN">Office Administration</option>
              <option value="MAINTENANCE">Maintenance & Servicing</option>
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Deduct From Account *
              </label>
              {selectedAccount && (
                <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  {selectedAccount.type.replace('_', ' ')}
                </span>
              )}
            </div>
            <select
              value={accountId}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
            >
              {accounts.length === 0 ? (
                <option value="">No accounts available</option>
              ) : (
                <>
                  <option value="">-- Direct Cash / Unassigned --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency} {Number(acc.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Live Balance Deduction Preview & Insufficient Balance Warning */}
        {selectedAccount && (
          <div
            className={`p-3.5 rounded-2xl border transition ${
              isInsufficient
                ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                : 'bg-rose-50/60 border-rose-200/80 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isInsufficient
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {isInsufficient ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Landmark className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{selectedAccount.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Current Balance:{' '}
                    <span className="font-semibold text-slate-700">
                      {selectedAccount.currency}{' '}
                      {currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isInsufficient ? 'text-amber-700' : 'text-rose-600'
                  }`}
                >
                  Projected Remaining
                </span>
                <span
                  className={`font-black text-sm flex items-center justify-end gap-1 ${
                    isInsufficient ? 'text-amber-700' : 'text-rose-700'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  {selectedAccount.currency}{' '}
                  {remainingBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {isInsufficient && (
              <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>
                  Warning: Expense amount exceeds available balance. Account will enter negative balance!
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="">-- Select Method --</option>
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
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
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        {/* Attachment Upload Field (Image or PDF) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-rose-600" />
              Attach Receipt / Voucher (Image or PDF)
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

          {!selectedFile && !uploadedReceipt ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-rose-400 bg-slate-50 hover:bg-rose-50/30 rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-white text-slate-400 group-hover:text-rose-600 shadow-2xs border border-slate-100 flex items-center justify-center transition">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                Click to upload receipt photo or PDF bill
              </p>
              <p className="text-[10px] text-slate-400">Supports Camera Snap, Screenshot, PDF Memo</p>
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
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedFile?.name || uploadedReceipt?.fileName || 'Attached Receipt'}
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
                        Ready to attach
                      </span>
                    )}
                    {selectedFile?.size && (
                      <span className="text-[10px] text-slate-400">
                        ({(selectedFile.size / 1024).toFixed(0)} KB)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition cursor-pointer"
                title="Remove attached file"
              >
                <X className="w-4 h-4" />
              </button>
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
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer flex items-center gap-1.5"
          >
            {isLoading ? 'Recording...' : 'Record Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
