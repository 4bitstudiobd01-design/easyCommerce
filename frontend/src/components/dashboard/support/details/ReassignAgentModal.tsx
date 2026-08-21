'use client';

import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { TicketRecord } from '../types';

interface ReassignAgentModalProps {
  ticket: TicketRecord;
  isOpen: boolean;
  onClose: () => void;
  onReassign: (agent: { name: string; role: string; email: string; initials: string }) => void;
}

const AGENTS_LIST = [
  {
    name: 'Sadia Ahmed',
    role: 'Support Agent',
    email: 'sadia.ahmed@easycommerce.com',
    initials: 'SA',
    department: 'Billing & Payments',
  },
  {
    name: 'Alex Rivera',
    role: 'Platform Engineer',
    email: 'alex.r@easycommerce.com',
    initials: 'AR',
    department: 'Technical & Infrastructure',
  },
  {
    name: 'David Miller',
    role: 'Security & DevOps',
    email: 'david.m@easycommerce.com',
    initials: 'DM',
    department: 'Security & Domain',
  },
  {
    name: 'Sarah Jenkins',
    role: 'Senior Billing Lead',
    email: 'sarah.j@easycommerce.com',
    initials: 'SJ',
    department: 'Merchant Success',
  },
];

export function ReassignAgentModal({
  ticket,
  isOpen,
  onClose,
  onReassign,
}: ReassignAgentModalProps) {
  const [selectedAgent, setSelectedAgent] = useState(
    ticket.assignedAgent?.name || 'Sadia Ahmed'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = AGENTS_LIST.find((a) => a.name === selectedAgent);
    if (found) {
      onReassign(found);
      toast.success(`Ticket reassigned to ${found.name}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Reassign Ticket #{ticket.codeId}
              </h2>
              <p className="text-xs text-slate-500">
                Select an agent to take ownership of this ticket.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            {AGENTS_LIST.map((agent) => {
              const isSelected = selectedAgent === agent.name;

              return (
                <div
                  key={agent.name}
                  onClick={() => setSelectedAgent(agent.name)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {agent.initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {agent.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {agent.role} • {agent.department}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Assign Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
