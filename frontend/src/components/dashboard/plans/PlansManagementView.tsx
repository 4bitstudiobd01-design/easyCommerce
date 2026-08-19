'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  FileDown,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { PlansKpiCards } from './PlansKpiCards';
import { PlansFilterBar } from './PlansFilterBar';
import { PlansTable } from './PlansTable';
import { SelectedPlanSidebarCard } from './SelectedPlanSidebarCard';
import { PlanOverviewDonutCard } from './PlanOverviewDonutCard';
import { QuickActionsCard } from './QuickActionsCard';
import { PlanHighlightsCard } from './PlanHighlightsCard';
import { RecentChangesCard } from './RecentChangesCard';
import { AddPlanModal } from './AddPlanModal';
import { PlanDetailsDrawer } from './PlanDetailsDrawer';
import { ExportPlansModal } from './ExportPlansModal';
import { INITIAL_PLANS, PLANS_KPIS } from './plansMockData';
import { PlanFilterState, PlanRecord } from './types';

export function PlansManagementView() {
  const [plans, setPlans] = useState<PlanRecord[]>(INITIAL_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord>(INITIAL_PLANS[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [drawerPlan, setDrawerPlan] = useState<PlanRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Aug 8 - Aug 14, 2026');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [filters, setFilters] = useState<PlanFilterState>({
    search: '',
    status: 'all',
    billingCycle: 'all',
    dateRange: 'Aug 8 - Aug 14, 2026',
  });

  const handleFilterChange = (key: keyof PlanFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      // 1. Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSubtitle = p.subtitle.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesSubtitle && !matchesDesc) {
          return false;
        }
      }

      // 2. Status filter
      if (filters.status !== 'all' && p.status !== filters.status) {
        return false;
      }

      // 3. Billing Cycle filter
      if (filters.billingCycle !== 'all' && p.billingCycle !== filters.billingCycle) {
        return false;
      }

      return true;
    });
  }, [plans, filters]);

  const handleAddPlan = (newPlan: Partial<PlanRecord>) => {
    setPlans((prev) => [newPlan as PlanRecord, ...prev]);
  };

  const handleViewDetails = (plan: PlanRecord) => {
    setDrawerPlan(plan);
    setIsDetailsOpen(true);
  };

  const handleToggleStatus = (plan: PlanRecord) => {
    setPlans((prev) =>
      prev.map((item) =>
        item.id === plan.id
          ? {
              ...item,
              status: item.status === 'Active' ? 'Inactive' : 'Active',
            }
          : item
      )
    );
    toast.success(
      `Plan "${plan.name}" marked as ${
        plan.status === 'Active' ? 'Inactive' : 'Active'
      }`
    );
  };

  const handleDuplicatePlan = (plan: PlanRecord) => {
    const duplicated: PlanRecord = {
      ...plan,
      id: `plan-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      merchantsCount: '0',
      merchantsShare: '(0%)',
      mrr: '৳0',
      mrrShare: '(0%)',
      status: 'Inactive',
    };
    setPlans((prev) => [...prev, duplicated]);
    toast.success(`Duplicated "${plan.name}" plan`);
  };

  const handleDeletePlan = (plan: PlanRecord) => {
    setPlans((prev) => prev.filter((item) => item.id !== plan.id));
    if (selectedPlan.id === plan.id && plans.length > 1) {
      setSelectedPlan(plans[0]);
    }
    toast.success(`Plan "${plan.name}" deleted`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Plans
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            Create and manage subscription plans for merchants.
          </p>
        </div>

        {/* Right: Actions (Date picker, Export, Add Plan) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Selector Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDatePickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDatePickerOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                  {[
                    'Aug 8 - Aug 14, 2026',
                    'Last 7 Days',
                    'Last 30 Days',
                    'This Month',
                    'Last Quarter',
                    'All Time',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDateRange(preset);
                        setIsDatePickerOpen(false);
                        toast.info(`Date range set to ${preset}`);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer ${
                        dateRange === preset
                          ? 'font-bold text-emerald-700 bg-emerald-50/60'
                          : 'text-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Add Plan Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Plan</span>
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Metric Cards (5 cards row) */}
      <PlansKpiCards kpis={PLANS_KPIS} />

      {/* 3. Middle Section (Left Table + Right Sidebar Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-start">
        {/* Left / Main Table Area (2 cols on lg, 3 cols on xl) */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4">
          <PlansFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onOpenAdvancedFilters={() => toast.info('Advanced filters')}
          />

          <PlansTable
            plans={filteredPlans}
            selectedPlanId={selectedPlan.id}
            onSelectPlan={(p) => setSelectedPlan(p)}
            onViewDetails={handleViewDetails}
            onEditPlan={handleViewDetails}
            onToggleStatus={handleToggleStatus}
            onDuplicatePlan={handleDuplicatePlan}
            onDeletePlan={handleDeletePlan}
          />
        </div>

        {/* Right Side Widgets (1 col) */}
        <div className="space-y-4">
          <SelectedPlanSidebarCard
            plan={selectedPlan}
            onViewDetails={handleViewDetails}
          />

          <PlanOverviewDonutCard />

          <QuickActionsCard
            onAddPlan={() => setIsAddModalOpen(true)}
            onOpenFeatures={() => toast.info('Manage feature matrix')}
            onOpenComparison={() => toast.info('Compare plan tiers')}
            onOpenPricing={() => toast.info('Pricing rules and regional currencies')}
          />
        </div>
      </div>

      {/* 4. Bottom Section (Plan Highlights + Recent Changes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlanHighlightsCard />
        <RecentChangesCard />
      </div>

      {/* 5. Modals & Drawers */}
      <AddPlanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPlan={handleAddPlan}
      />

      <ExportPlansModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalPlansCount={plans.length}
      />

      <PlanDetailsDrawer
        plan={drawerPlan}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
