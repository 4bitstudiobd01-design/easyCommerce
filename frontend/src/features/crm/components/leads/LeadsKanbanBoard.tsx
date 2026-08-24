'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lead, LeadStageType } from '../../types/crm.types';
import {
  Plus,
  Building,
  Sparkles,
  ArrowDown,
  MessageCircle,
  PhoneCall,
  UserCheck,
  Flame,
  Clock,
  Columns3,
  Grid2X2,
  GripVertical,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  RotateCcw,
} from 'lucide-react';
import { LeadStageDropdown } from './LeadStageDropdown';
import { formatCrmDate } from '../../utils/formatDate';

interface LeadsKanbanBoardProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: LeadStageType) => void;
  onOpenAddModal: () => void;
  onOpenConvertModal: (lead: Lead) => void;
  onOpenQuickContact: (lead: Lead, channel: 'WHATSAPP' | 'CALL') => void;
  onOpenScheduleFollowUp: (lead: Lead) => void;
  onClearFollowUp?: (leadId: string) => void;
  onSelectLead?: (lead: Lead) => void;
}

interface StageConfig {
  id: LeadStageType;
  label: string;
  shortLabel: string;
  dotColor: string;
  accentBar: string;
  containerBg: string;
  containerBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dropHighlight: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'NEW',
    label: 'New Inquiry',
    shortLabel: 'New',
    dotColor: 'bg-sky-500',
    accentBar: 'bg-sky-500',
    containerBg: 'bg-sky-50/40',
    containerBorder: 'border-sky-200/80',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-200',
    dropHighlight: 'ring-2 ring-sky-500/80 bg-sky-100/70 border-sky-400',
  },
  {
    id: 'CONTACTED',
    label: 'Contacted',
    shortLabel: 'Contacted',
    dotColor: 'bg-indigo-500',
    accentBar: 'bg-indigo-500',
    containerBg: 'bg-indigo-50/40',
    containerBorder: 'border-indigo-200/80',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    dropHighlight: 'ring-2 ring-indigo-500/80 bg-indigo-100/70 border-indigo-400',
  },
  {
    id: 'QUALIFIED',
    label: 'Qualified Lead',
    shortLabel: 'Qualified',
    dotColor: 'bg-amber-500',
    accentBar: 'bg-amber-500',
    containerBg: 'bg-amber-50/40',
    containerBorder: 'border-amber-200/80',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-200',
    dropHighlight: 'ring-2 ring-amber-500/80 bg-amber-100/70 border-amber-400',
  },
  {
    id: 'PROPOSAL_SENT',
    label: 'Proposal Sent',
    shortLabel: 'Proposal',
    dotColor: 'bg-purple-500',
    accentBar: 'bg-purple-500',
    containerBg: 'bg-purple-50/40',
    containerBorder: 'border-purple-200/80',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-200',
    dropHighlight: 'ring-2 ring-purple-500/80 bg-purple-100/70 border-purple-400',
  },
  {
    id: 'WON',
    label: 'Won / Converted',
    shortLabel: 'Won',
    dotColor: 'bg-emerald-500',
    accentBar: 'bg-emerald-500',
    containerBg: 'bg-emerald-50/40',
    containerBorder: 'border-emerald-200/80',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-200',
    dropHighlight: 'ring-2 ring-emerald-500/80 bg-emerald-100/70 border-emerald-400',
  },
  {
    id: 'LOST',
    label: 'Lost / Closed',
    shortLabel: 'Lost',
    dotColor: 'bg-rose-400',
    accentBar: 'bg-rose-400',
    containerBg: 'bg-rose-50/30',
    containerBorder: 'border-rose-200/80',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    dropHighlight: 'ring-2 ring-rose-400/80 bg-rose-100/70 border-rose-400',
  },
];

// ─── Ghost / Drag Overlay Element ─────────────────────────────
let ghostEl: HTMLElement | null = null;

function createGhost(sourceEl: HTMLElement, x: number, y: number) {
  if (ghostEl) ghostEl.remove();
  ghostEl = sourceEl.cloneNode(true) as HTMLElement;
  ghostEl.style.position = 'fixed';
  ghostEl.style.width = `${sourceEl.offsetWidth}px`;
  ghostEl.style.pointerEvents = 'none';
  ghostEl.style.zIndex = '9999';
  ghostEl.style.opacity = '0.85';
  ghostEl.style.transform = 'rotate(2deg) scale(1.03)';
  ghostEl.style.boxShadow = '0 20px 40px rgba(0,0,0,0.25)';
  ghostEl.style.borderRadius = '12px';
  ghostEl.style.transition = 'box-shadow 0.1s ease';
  ghostEl.style.left = `${x - sourceEl.offsetWidth / 2}px`;
  ghostEl.style.top = `${y - 30}px`;
  document.body.appendChild(ghostEl);
}

function moveGhost(x: number, y: number, offsetW: number) {
  if (!ghostEl) return;
  ghostEl.style.left = `${x - offsetW / 2}px`;
  ghostEl.style.top = `${y - 30}px`;
}

function removeGhost() {
  if (ghostEl) {
    ghostEl.remove();
    ghostEl = null;
  }
}

// ─── Main Component ────────────────────────────────────────────
export const LeadsKanbanBoard: React.FC<LeadsKanbanBoardProps> = ({
  leads,
  onStageChange,
  onOpenAddModal,
  onOpenConvertModal,
  onOpenQuickContact,
  onOpenScheduleFollowUp,
  onClearFollowUp,
  onSelectLead,
}) => {
  const [boardLayout, setBoardLayout] = useState<'FIT' | 'LANES' | 'GRID'>('FIT');

  // Pointer-based drag state
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStageType | null>(null);
  const draggingRef = useRef<string | null>(null);
  const ghostWidthRef = useRef<number>(240);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  // Column refs for hit-testing
  const columnRefs = useRef<Map<LeadStageType, HTMLDivElement>>(new Map());
  const boardContainerRef = useRef<HTMLDivElement>(null);

  const getLeadsByStage = (stage: LeadStageType) => leads.filter((l) => l.stage === stage);
  const getStageTotalValue = (stage: LeadStageType) =>
    getLeadsByStage(stage).reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

  // Hit-test: which column is the pointer over?
  const getStageAtPoint = useCallback((clientX: number, clientY: number): LeadStageType | null => {
    const entries = Array.from(columnRefs.current.entries());
    for (const [stageId, el] of entries) {
      const rect = el.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return stageId;
      }
    }
    return null;
  }, []);

  // Auto-scroll the board while dragging near edges (LANES mode)
  const autoScrollRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  const performAutoScroll = useCallback(() => {
    if (!boardContainerRef.current || !mouseRef.current || boardLayout !== 'LANES') return;
    const container = boardContainerRef.current;
    const rect = container.getBoundingClientRect();
    const { x: mx } = mouseRef.current;
    const edge = 120;
    const maxSpeed = 20;
    if (mx > rect.right - edge) {
      const dist = mx - (rect.right - edge);
      container.scrollLeft += Math.min(maxSpeed, Math.round((dist / edge) * maxSpeed));
    } else if (mx < rect.left + edge) {
      const dist = (rect.left + edge) - mx;
      container.scrollLeft -= Math.min(maxSpeed, Math.round((dist / edge) * maxSpeed));
    }
    autoScrollRef.current = requestAnimationFrame(performAutoScroll);
  }, [boardLayout]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current !== null) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  // Global pointer-move & pointer-up listeners
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      mouseRef.current = { x: e.clientX, y: e.clientY };
      moveGhost(e.clientX, e.clientY, ghostWidthRef.current);

      const over = getStageAtPoint(e.clientX, e.clientY);
      setDragOverStage(over);

      // Start auto-scroll loop
      if (boardLayout === 'LANES' && autoScrollRef.current === null) {
        autoScrollRef.current = requestAnimationFrame(performAutoScroll);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const over = getStageAtPoint(e.clientX, e.clientY);
      if (over && draggingRef.current) {
        onStageChange(draggingRef.current, over);
      }

      removeGhost();
      stopAutoScroll();
      setDraggingLeadId(null);
      setDragOverStage(null);
      draggingRef.current = null;
      mouseRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      stopAutoScroll();
    };
  }, [getStageAtPoint, onStageChange, boardLayout, performAutoScroll, stopAutoScroll]);

  const handleCardPointerDown = (e: React.PointerEvent<HTMLDivElement>, lead: Lead) => {
    // Only start drag on left button; also ignore clicks on buttons inside the card
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-no-drag]')) return;

    startPosRef.current = { x: e.clientX, y: e.clientY };
    const cardEl = e.currentTarget;
    ghostWidthRef.current = cardEl.offsetWidth;

    // Small threshold before confirming drag (avoids accidental drags on click)
    const onTentativeMove = (me: PointerEvent) => {
      const dx = me.clientX - (startPosRef.current?.x ?? me.clientX);
      const dy = me.clientY - (startPosRef.current?.y ?? me.clientY);
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        document.removeEventListener('pointermove', onTentativeMove);
        document.removeEventListener('pointerup', onCancel);
        // Start actual drag
        isDraggingRef.current = true;
        draggingRef.current = lead.id;
        setDraggingLeadId(lead.id);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        createGhost(cardEl, me.clientX, me.clientY);
        mouseRef.current = { x: me.clientX, y: me.clientY };
      }
    };
    const onCancel = () => {
      document.removeEventListener('pointermove', onTentativeMove);
      document.removeEventListener('pointerup', onCancel);
      if (!isDraggingRef.current && onSelectLead) {
        onSelectLead(lead);
      }
    };
    document.addEventListener('pointermove', onTentativeMove);
    document.addEventListener('pointerup', onCancel);
  };

  const handleScrollLanes = (direction: 'left' | 'right') => {
    if (boardContainerRef.current) {
      boardContainerRef.current.scrollBy({ left: direction === 'left' ? -350 : 350, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full space-y-4 pb-8">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-500">
          <span className="font-extrabold text-slate-800">All 6 Pipeline Stages</span>
          <span>•</span>
          <span>{leads.length} Total Leads</span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-lg font-bold text-[11px]">
            <Sparkles className="w-3 h-3 text-blue-600" />
            Drag cards between columns
          </span>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          {boardLayout === 'LANES' && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
              <button onClick={() => handleScrollLanes('left')} className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => handleScrollLanes('right')} className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {(['FIT', 'LANES', 'GRID'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setBoardLayout(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  boardLayout === mode ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode === 'FIT' && <><Maximize2 className="w-3.5 h-3.5" /><span>Fit All 6</span></>}
                {mode === 'LANES' && <><Columns3 className="w-3.5 h-3.5" /><span>Swimlanes</span></>}
                {mode === 'GRID' && <><Grid2X2 className="w-3.5 h-3.5" /><span>Grid</span></>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating drop-target bar while dragging */}
      {draggingLeadId && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 shrink-0">
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Drag card to any column below:</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 flex-1">
            {STAGES.map((s) => (
              <div
                key={s.id}
                className={`py-2 px-2 rounded-xl text-center text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                  dragOverStage === s.id
                    ? 'bg-blue-600 border-white text-white scale-105 ring-2 ring-blue-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dotColor} shrink-0`} />
                <span className="truncate text-[11px]">{s.shortLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Grid */}
      <div
        ref={boardContainerRef}
        className={
          boardLayout === 'FIT'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 w-full items-start'
            : boardLayout === 'LANES'
            ? 'flex gap-4 overflow-x-auto pb-4 items-stretch min-w-full'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full'
        }
      >
        {STAGES.map((col) => {
          const colLeads = getLeadsByStage(col.id);
          const totalVal = getStageTotalValue(col.id);
          const isOver = dragOverStage === col.id;

          return (
            <div
              key={col.id}
              ref={(el) => {
                if (el) columnRefs.current.set(col.id, el);
                else columnRefs.current.delete(col.id);
              }}
              className={`flex flex-col h-[680px] rounded-2xl border transition-all duration-150 overflow-hidden ${
                isOver
                  ? col.dropHighlight
                  : `${col.containerBg} ${col.containerBorder} shadow-2xs`
              } ${boardLayout === 'LANES' ? 'w-[300px] min-w-[300px] shrink-0' : 'w-full'}`}
            >
              {/* Accent Bar */}
              <div className={`h-1.5 w-full ${col.accentBar}`} />

              {/* Column Header */}
              <div className="p-3 bg-white/95 border-b border-slate-200/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor} shrink-0`} />
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight truncate">
                    {boardLayout === 'FIT' ? col.shortLabel : col.label}
                  </h3>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${col.badgeBg} ${col.badgeText} ${col.badgeBorder}`}>
                    {colLeads.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-black text-slate-800">
                    ৳{totalVal > 99999 ? `${(totalVal / 1000).toFixed(0)}k` : totalVal.toLocaleString()}
                  </span>
                  <button
                    onClick={onOpenAddModal}
                    className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cards Scroll Area */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
                {/* Drop indicator */}
                {isOver && draggingLeadId && (
                  <div className="p-3 border-2 border-dashed border-blue-500 rounded-xl bg-blue-50/90 text-blue-700 text-xs font-black text-center flex items-center justify-center gap-2 animate-pulse">
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                    <span>Release to move here</span>
                  </div>
                )}

                {colLeads.length === 0 && !isOver ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200/80 rounded-2xl p-3 text-slate-400 space-y-2">
                    <span className="text-xs font-semibold">No leads here</span>
                    <button
                      onClick={onOpenAddModal}
                      className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-xl shadow-2xs flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Lead
                    </button>
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    const isBeingDragged = draggingLeadId === lead.id;
                    return (
                      <div
                        key={lead.id}
                        onPointerDown={(e) => handleCardPointerDown(e, lead)}
                        style={{ touchAction: 'none' }}
                        className={`bg-white p-3 rounded-xl border space-y-2 group relative transition-all ${
                          isBeingDragged
                            ? 'opacity-25 scale-95 border-dashed border-blue-400 shadow-none'
                            : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 cursor-grab active:cursor-grabbing'
                        }`}
                      >
                        {/* Header: grip + name + score */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" />
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {lead.name}
                              </h4>
                              {lead.companyName && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                  <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{lead.companyName}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          {lead.leadScore ? (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded text-[10px] font-black flex items-center gap-0.5 shrink-0">
                              <Flame className="w-3 h-3 text-amber-500" />
                              {lead.leadScore}
                            </span>
                          ) : null}
                        </div>

                        {/* Notes */}
                        {lead.notes && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100/90 leading-relaxed">
                            {lead.notes}
                          </p>
                        )}

                        {/* Follow-up pill or Set Time shortcut */}
                        {lead.nextFollowUpAt ? (
                          <div
                            data-no-drag
                            className={`p-1.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                              new Date(lead.nextFollowUpAt) < new Date()
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-amber-50 border-amber-200 text-amber-900'
                            }`}
                          >
                            <div
                              onClick={() => onOpenScheduleFollowUp(lead)}
                              className="flex items-center gap-1 text-[10px] font-bold min-w-0 flex-1 cursor-pointer hover:opacity-80"
                              title="ক্লিক করে সময় পরিবর্তন করুন"
                            >
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span className="truncate">
                                {new Date(lead.nextFollowUpAt) < new Date() ? '⚠️ Due: ' : '⏰ '}
                                {formatCrmDate(lead.nextFollowUpAt, { showTime: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenScheduleFollowUp(lead)}
                                className="text-[10px] text-amber-700 hover:text-amber-900 font-bold px-1 py-0.5 hover:bg-amber-100/80 rounded transition-colors"
                                title="পরিবর্তন করুন (Edit)"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClearFollowUp && onClearFollowUp(lead.id);
                                }}
                                className="p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-100/80 rounded transition-colors"
                                title="সময় রিসেট / মুছে ফেলুন (Reset / Remove Time)"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            data-no-drag
                            onClick={() => onOpenScheduleFollowUp(lead)}
                            className="w-full py-1 px-2 border border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/60 rounded-lg text-[10px] font-bold text-slate-400 hover:text-amber-800 flex items-center justify-center gap-1 transition-all"
                          >
                            <Clock className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                            <span>+ কথা বলার সময় সেট করুন</span>
                          </button>
                        )}

                        {/* Value + source */}
                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <span className="font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                            ৳{Number(lead.estimatedValue || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {lead.source}
                          </span>
                        </div>

                        {/* Action bar (data-no-drag prevents accidental drag start) */}
                        <div
                          data-no-drag
                          className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1"
                        >
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenQuickContact(lead, 'WHATSAPP')}
                              className="w-7 h-7 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenQuickContact(lead, 'CALL')}
                              className="w-7 h-7 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                              title="Call"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenScheduleFollowUp(lead)}
                              className="w-7 h-7 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all"
                              title="Schedule Follow-Up"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            {(col.id === 'QUALIFIED' || col.id === 'PROPOSAL_SENT') && (
                              <button
                                type="button"
                                onClick={() => onOpenConvertModal(lead)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Won</span>
                              </button>
                            )}
                            <LeadStageDropdown
                              currentStage={lead.stage}
                              onStageChange={(newStage) => onStageChange(lead.id, newStage)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
