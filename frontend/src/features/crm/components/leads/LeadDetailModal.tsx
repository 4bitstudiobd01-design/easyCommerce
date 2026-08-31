'use client';

import React, { useState, useEffect } from 'react';
import { Lead, LeadStageType } from '../../types/crm.types';
import {
  X,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  Clock,
  Flame,
  MessageCircle,
  PhoneCall,
  UserCheck,
  Tag,
  User,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  ChevronRight,
  Send,
  Trash2,
  AlertTriangle,
  ShoppingBag,
  Package,
  MessageSquare,
} from 'lucide-react';
import { LeadStageDropdown } from './LeadStageDropdown';
import { formatCrmDate } from '../../utils/formatDate';
import { getFollowUpInfo } from '../../utils/followUpHelper';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  useUpdateLeadDetailsMutation,
  useAddLeadInquiryMutation,
  useDeleteLeadInquiryMutation,
} from '../../api/crmApi';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStageChange: (leadId: string, newStage: LeadStageType) => void;
  onOpenConvertModal: (lead: Lead) => void;
  onOpenQuickContact: (lead: Lead, channel: 'WHATSAPP' | 'CALL') => void;
  onOpenScheduleFollowUp: (lead: Lead) => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

const STAGES: { id: LeadStageType; label: string; dotColor: string; activeBg: string }[] = [
  { id: 'NEW', label: 'New Inquiry', dotColor: 'bg-sky-500', activeBg: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'CONTACTED', label: 'Contacted', dotColor: 'bg-indigo-500', activeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'QUALIFIED', label: 'Qualified Lead', dotColor: 'bg-amber-500', activeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', dotColor: 'bg-purple-500', activeBg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'WON', label: 'Won / Converted', dotColor: 'bg-emerald-500', activeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'LOST', label: 'Lost / Closed', dotColor: 'bg-rose-400', activeBg: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onStageChange,
  onOpenConvertModal,
  onOpenQuickContact,
  onOpenScheduleFollowUp,
  onLeadUpdated,
}) => {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'followup' | 'timeline'>('overview');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState('');
  const [editableValue, setEditableValue] = useState('');
  const [updateLeadDetails, { isLoading: isSavingRequirements }] = useUpdateLeadDetailsMutation();

  const currentUserName = authUser?.fullName || authUser?.email || lead?.assignedStaffName || 'Merchant';
  const currentUserRole =
    authUser?.role === 'STORE_OWNER'
      ? 'Merchant'
      : authUser?.role === 'SUPER_ADMIN'
      ? 'Admin'
      : authUser?.role === 'STORE_STAFF'
      ? 'Staff'
      : 'Merchant';
  const currentUserId = authUser?.id;

  // Multi-person inquiry state
  const [newInquiryNote, setNewInquiryNote] = useState('');
  const [inquiryAuthorName, setInquiryAuthorName] = useState(currentUserName);
  const [inquiryAuthorRole, setInquiryAuthorRole] = useState(currentUserRole);
  const [addLeadInquiry, { isLoading: isAddingInquiry }] = useAddLeadInquiryMutation();
  const [deleteLeadInquiry, { isLoading: isDeletingInquiry }] = useDeleteLeadInquiryMutation();

  useEffect(() => {
    if (lead) {
      setEditableNotes(lead.notes || '');
      setEditableValue(String(lead.estimatedValue || ''));
      setIsEditingNotes(false);
      setInquiryAuthorName(currentUserName);
      setInquiryAuthorRole(currentUserRole);
      setNewInquiryNote('');
      setActiveTab('overview');
    }
  }, [lead?.id, currentUserName, currentUserRole]);

  if (!isOpen || !lead) return null;

  const currentStageConfig = STAGES.find((s) => s.id === lead.stage) || STAGES[0];

  const handleSaveRequirements = async () => {
    const notes = editableNotes.trim() || undefined;
    const estimatedValue = Number(editableValue) || lead.estimatedValue;

    try {
      const updatedLead = await updateLeadDetails({
        id: lead.id,
        notes,
        estimatedValue,
      }).unwrap();

      if (onLeadUpdated) {
        onLeadUpdated(updatedLead);
      }
      setIsEditingNotes(false);
      toast.success('Lead requirements and estimated value updated!');
    } catch (err: any) {
      toast.error('Failed to update lead requirements. Please try again.');
    }
  };

  const handleAddInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInquiryNote.trim()) {
      toast.error('অনুগ্রহ করে ইনকোয়ারি বা ডিসকাশন নোট লিখুন');
      return;
    }

    try {
      const updatedLead = await addLeadInquiry({
        id: lead.id,
        note: newInquiryNote.trim(),
        authorName: inquiryAuthorName.trim() || currentUserName,
        authorRole: inquiryAuthorRole || currentUserRole,
        authorId: currentUserId,
      }).unwrap();

      setNewInquiryNote('');
      if (onLeadUpdated) {
        onLeadUpdated(updatedLead);
      }
      toast.success('ইনকোয়ারি নোট সফলভাবে যুক্ত করা হয়েছে');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to add inquiry note');
    }
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    try {
      const updatedLead = await deleteLeadInquiry({
        id: lead.id,
        inquiryId,
      }).unwrap();

      if (onLeadUpdated) {
        onLeadUpdated(updatedLead);
      }
      toast.success('ইনকোয়ারি নোট মুছে ফেলা হয়েছে');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete inquiry note');
    }
  };

  const handleStageSelect = (stageId: LeadStageType) => {
    if (stageId === 'WON' && onOpenConvertModal) {
      onClose();
      onOpenConvertModal(lead);
    } else {
      onStageChange(lead.id, stageId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between shrink-0 relative rounded-t-3xl z-30">
          <div className="absolute inset-0 rounded-t-3xl overflow-hidden pointer-events-none">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
          </div>

          <div className="flex items-start gap-3.5 relative z-10 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white truncate">{lead.name}</h2>
                
                {/* Interactive Status Dropdown */}
                <LeadStageDropdown
                  currentStage={lead.stage}
                  onStageChange={(newStage) => handleStageSelect(newStage)}
                  variant="header-badge"
                />

                {lead.leadScore ? (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-black flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    Score {lead.leadScore}/100
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                {lead.companyName && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.companyName}</span>
                  </span>
                )}
                <span>•</span>
                <span className="text-emerald-400 font-extrabold">
                  Est. Deal: ৳{Number(lead.estimatedValue || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQuickContact(lead, 'WHATSAPP')}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => onOpenQuickContact(lead, 'CALL')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Direct Call</span>
            </button>
            <button
              onClick={() => onOpenScheduleFollowUp(lead)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule Follow-Up</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-500 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`pb-2.5 transition-all border-b-2 flex items-center gap-1 ${
              activeTab === 'requirements'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Inquiry Requirements</span>
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`pb-2.5 transition-all border-b-2 flex items-center gap-1 ${
              activeTab === 'followup'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Follow-Up ({lead.nextFollowUpAt ? 'Active' : 'None'})</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 transition-all border-b-2 ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Pipeline Stage Flow
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Contact Information Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                  Contact & Business Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                      <a href={`tel:${lead.phone}`} className="font-bold text-slate-900 hover:text-blue-600">
                        {lead.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                      <span className="font-bold text-slate-900">
                        {lead.email || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Organization</p>
                      <span className="font-bold text-slate-900">
                        {lead.companyName || 'Individual Customer'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Lead Source</p>
                      <span className="font-bold text-slate-900 uppercase">
                        {lead.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Value & Staff Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                  <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider block">
                    Estimated Deal Budget
                  </span>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    ৳{Number(lead.estimatedValue || 0).toLocaleString()} BDT
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-1">Potential lifetime value of converted lead</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                    Assigned Account Staff
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{lead.assignedStaffName || authUser?.fullName || 'Assigned Staff'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Created on {formatCrmDate(lead.createdAt)}
                  </p>
                </div>
              </div>

              {/* Fallback banner for WON leads if orders are empty */}
              {lead.stage === 'WON' && (!lead.orders || lead.orders.length === 0) && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">
                        লিডটি সফলভাবে WON / Converted হয়েছে
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        মোট ডিল ভ্যালু: ৳{Number(lead.estimatedValue || 0).toLocaleString()} BDT
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black">
                    WON
                  </span>
                </div>
              )}

              {/* Ordered Products / Purchase History (Won Deals) */}
              {lead.orders && lead.orders.length > 0 && (
                <div className="bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">
                          ক্রয়কৃত পণ্যের বিবরণ ও অর্ডার হিস্ট্রি (Purchased Products & Orders)
                        </h4>
                        <p className="text-[10px] text-emerald-800">
                          {lead.orders.length} টি অর্ডার সফলভাবে সম্পন্ন হয়েছে
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black">
                      WON Deal
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {lead.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              #{ord.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatCrmDate(ord.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                              {ord.paymentMethod} • {ord.paymentStatus}
                            </span>
                            <span className="font-black text-emerald-700 text-xs">
                              ৳{Number(ord.grandTotal).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {ord.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {item.productImageUrl ? (
                                      <img
                                        src={item.productImageUrl}
                                        alt={item.productTitle}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-xs truncate">
                                      {item.productTitle}
                                    </p>
                                    {item.sku && (
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        SKU: {item.sku}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                  <span className="text-[10px] text-slate-500 font-bold mr-2">
                                    ৳{Number(item.unitPrice).toLocaleString()} × {item.quantity}
                                  </span>
                                  <span className="font-black text-slate-900 text-xs">
                                    ৳{Number(item.totalPrice).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Inquiries Preview on Overview Tab */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>টিম কমেন্ট ও ইনকোয়ারি নোট ({lead.inquiries?.length || (lead.notes ? 1 : 0)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('requirements')}
                    className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <span>+ নতুন কমেন্ট যোগ করুন</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {lead.inquiries && lead.inquiries.length > 0 ? (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-900">
                        {lead.inquiries[0].authorName} <span className="text-slate-400 font-normal">({lead.inquiries[0].authorRole || 'Staff'})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatCrmDate(lead.inquiries[0].createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-700 line-clamp-2 leading-relaxed">
                      {lead.inquiries[0].note}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-600 text-xs italic bg-white p-2 rounded-xl border border-slate-100">
                    {lead.notes || 'এখনো কোনো ইনকোয়ারি কমেন্ট যুক্ত করা হয়নি।'}
                  </p>
                )}
              </div>

              {/* Tags Section */}
              {lead.tags && lead.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    Associated Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INQUIRY REQUIREMENTS & MULTI-STAFF LOG */}
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>টিম ইনকোয়ারি ও কাস্টমার রিকোয়ারমেন্ট লগ</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black">
                      {(lead.inquiries?.length || (lead.notes ? 1 : 0))} টি নোট
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    অ্যাডমিন, ম্যানেজার বা টিম মেম্বারদের ইনকোয়ারি ও ডিসকাশন বিবরণ
                  </p>
                </div>

                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1 text-xs"
                    title="Edit Estimated Deal Value"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ডিল বাজেট এডিট</span>
                  </button>
                )}
              </div>

              {/* Deal Budget Quick Edit */}
              {isEditingNotes && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-blue-900">Estimated Deal Value (BDT)</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsEditingNotes(false)}
                        className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveRequirements}
                        disabled={isSavingRequirements}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save Budget</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={editableValue}
                    onChange={(e) => setEditableValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              )}

              {/* Add New Inquiry Form */}
              <form
                onSubmit={handleAddInquiry}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>নতুন ইনকোয়ারি বা ডিসকাশন নোট যোগ করুন</span>
                  </span>
                </div>

                <textarea
                  rows={2}
                  value={newInquiryNote}
                  onChange={(e) => setNewInquiryNote(e.target.value)}
                  placeholder="কাস্টমার কী চেয়েছেন, কী কথা হয়েছে বা কোনো বিশেষ রিকোয়ারমেন্ট লিখুন..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 leading-relaxed"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">ইনকোয়ারি করেছেন:</span>
                      <input
                        type="text"
                        value={inquiryAuthorName}
                        onChange={(e) => setInquiryAuthorName(e.target.value)}
                        placeholder="নাম লিখুন"
                        className="font-bold text-slate-800 text-xs focus:outline-none w-28"
                      />
                    </div>

                    <div className="flex items-center gap-1 bg-white px-2 py-1 border border-slate-200 rounded-lg text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">পদবী/রোল:</span>
                      <select
                        value={inquiryAuthorRole}
                        onChange={(e) => setInquiryAuthorRole(e.target.value)}
                        className="font-bold text-slate-800 text-xs bg-transparent focus:outline-none cursor-pointer"
                      >
                        <option value="Merchant">Merchant</option>
                        <option value="Admin">Admin</option>
                        <option value="Store Manager">Store Manager</option>
                        <option value="Sales Executive">Sales Executive</option>
                        <option value="Support Staff">Support Staff</option>
                      </select>
                    </div>

                    {currentUserId && (
                      <span
                        className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-mono font-bold border border-slate-200"
                        title={`Your User ID: ${currentUserId}`}
                      >
                        ID: #{currentUserId.slice(0, 8)}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingInquiry || !newInquiryNote.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAddingInquiry ? 'যোগ হচ্ছে...' : 'ইনকোয়ারি নোট যোগ করুন'}</span>
                  </button>
                </div>
              </form>

              {/* Inquiries Timeline & Log List */}
              <div className="space-y-2.5 pt-1">
                {(() => {
                  const inquiryList =
                    lead.inquiries && lead.inquiries.length > 0
                      ? lead.inquiries
                      : lead.notes
                      ? [
                          {
                            id: 'legacy-init',
                            authorName: lead.assignedStaffName || 'Initial Requirement',
                            authorRole: 'Initial Inquiry',
                            authorId: undefined,
                            note: lead.notes,
                            createdAt: lead.createdAt,
                          },
                        ]
                      : [];

                  if (inquiryList.length === 0) {
                    return (
                      <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl text-center space-y-1">
                        <FileText className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">
                          এখনো কোনো ইনকোয়ারি নোট যোগ করা হয়নি
                        </p>
                        <p className="text-[11px] text-slate-400">
                          ওপরের ফর্ম ব্যবহার করে কাস্টমারের সাথে আলোচনার নোট যুক্ত করুন
                        </p>
                      </div>
                    );
                  }

                  return inquiryList.map((inq) => {
                    const roleColor =
                      inq.authorRole?.toLowerCase().includes('merchant')
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : inq.authorRole?.toLowerCase().includes('admin')
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : inq.authorRole?.toLowerCase().includes('manager')
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : inq.authorRole?.toLowerCase().includes('sales')
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                    return (
                      <div
                        key={inq.id}
                        className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-2 group hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs shrink-0">
                              {inq.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="font-extrabold text-xs text-slate-900 truncate">
                                {inq.authorName}
                              </span>
                              {inq.authorRole && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${roleColor}`}
                                >
                                  {inq.authorRole}
                                </span>
                              )}
                              {inq.authorId && (
                                <span
                                  className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-mono font-bold border border-slate-200"
                                  title={`User ID: ${inq.authorId}`}
                                >
                                  ID: #{inq.authorId.slice(0, 8)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatCrmDate(inq.createdAt)}
                            </span>
                            {inq.id !== 'legacy-init' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteInquiry(inq.id)}
                                disabled={isDeletingInquiry}
                                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete inquiry note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap pl-9">
                          {inq.note}
                        </p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB 3: FOLLOW-UP REMINDER */}
          {activeTab === 'followup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Scheduled Follow-Up</h3>
                  <p className="text-xs text-slate-500">Upcoming call or message reminders for this deal</p>
                </div>
                <button
                  onClick={() => onOpenScheduleFollowUp(lead)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lead.nextFollowUpAt ? 'Reschedule' : 'Set Reminder'}</span>
                </button>
              </div>

              {lead.nextFollowUpAt ? (
                (() => {
                  const info = getFollowUpInfo(lead.nextFollowUpAt, lead.stage);
                  return (
                    <div
                      className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                        info.isMissed
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950 ring-1 ring-rose-200'
                          : 'bg-amber-50 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {info.isMissed ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-600" />
                        )}
                        <span className="font-black text-slate-900 text-sm">
                          {info.formattedDate}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-black text-[10px] inline-flex items-center gap-1 border ${info.badgeClasses}`}
                        >
                          {info.isMissed ? `🔴 ${info.label}` : info.label}
                        </span>
                      </div>
                      {lead.followUpNote && (
                        <p
                          className={`text-xs mt-1 p-2.5 rounded-xl border ${
                            info.isMissed
                              ? 'bg-white/90 text-rose-900 border-rose-200 font-medium'
                              : 'bg-white text-slate-700 border-amber-200/60'
                          }`}
                        >
                          📝 {lead.followUpNote}
                        </p>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                  <Clock className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-semibold text-xs">No follow-up reminder scheduled yet</p>
                  <button
                    onClick={() => onOpenScheduleFollowUp(lead)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Schedule Callback
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PIPELINE STAGE FLOW */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Move Pipeline Stage</h3>
                <p className="text-xs text-slate-500">Click any stage below to transition this lead immediately</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STAGES.map((s) => {
                  const isCurrent = lead.stage === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStageSelect(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isCurrent
                          ? `${s.activeBg} ring-2 ring-blue-500 font-black shadow-sm`
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dotColor}`} />
                        <span className="text-xs font-bold">{s.label}</span>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
