'use client';

import React, { useState } from 'react';
import { PlanRecord } from '../types';
import { PlanOverviewHeader } from './PlanOverviewHeader';
import { PlanInfoBanner } from './PlanInfoBanner';
import { PlanDetailsTabs } from './PlanDetailsTabs';
import { PlanPerformanceCard } from './PlanPerformanceCard';
import { PlanDescriptionCard } from './PlanDescriptionCard';
import { PlanLimitsSummaryCard } from './PlanLimitsSummaryCard';
import { PlanBottomBar } from './PlanBottomBar';
import { ComparePlansModal } from './ComparePlansModal';
import { EditPlanDetailsModal } from './EditPlanDetailsModal';
import { toast } from 'sonner';

interface PlanDetailsViewProps {
  plan: PlanRecord;
  onBack: () => void;
  onUpdatePlan?: (updatedPlan: PlanRecord) => void;
  onDuplicatePlan?: (plan: PlanRecord) => void;
}

export function PlanDetailsView({
  plan: initialPlan,
  onBack,
  onUpdatePlan,
  onDuplicatePlan,
}: PlanDetailsViewProps) {
  const [currentPlan, setCurrentPlan] = useState<PlanRecord>(initialPlan);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePlan = (updated: PlanRecord) => {
    setCurrentPlan(updated);
    onUpdatePlan?.(updated);
  };

  const handleToggleStatus = () => {
    const updatedStatus = currentPlan.status === 'Active' ? 'Inactive' : 'Active';
    const updated: PlanRecord = {
      ...currentPlan,
      status: updatedStatus,
      updatedAt: {
        date: 'Aug 10, 2026',
        time: '02:15 PM',
      },
    };
    setCurrentPlan(updated);
    onUpdatePlan?.(updated);
    toast.success(`Plan "${currentPlan.name}" is now ${updatedStatus}`);
  };

  const handleDuplicate = () => {
    if (onDuplicatePlan) {
      onDuplicatePlan(currentPlan);
    } else {
      toast.success(`Duplicated "${currentPlan.name}" plan as copy`);
    }
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(currentPlan, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${currentPlan.name.toLowerCase()}-plan-details.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported ${currentPlan.name} plan schema as JSON`);
  };

  const handleBottomBarSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onUpdatePlan?.(currentPlan);
      toast.success(`All modifications to ${currentPlan.name} plan have been saved!`);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header with Breadcrumbs & Action Buttons */}
      <PlanOverviewHeader
        plan={currentPlan}
        onBack={onBack}
        onEdit={() => setIsEditModalOpen(true)}
        onDuplicate={handleDuplicate}
        onToggleStatus={handleToggleStatus}
        onExport={handleExport}
      />

      {/* 2. Top Overview Info Card */}
      <PlanInfoBanner plan={currentPlan} />

      {/* 3. Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section: Tabs (Features & Limits, Pricing, etc.) */}
        <div className="lg:col-span-8 space-y-6">
          <PlanDetailsTabs
            plan={currentPlan}
            onOpenComparePlans={() => setIsCompareModalOpen(true)}
            onPlanChange={(partial) => {
              const updated = { ...currentPlan, ...partial };
              setCurrentPlan(updated);
              onUpdatePlan?.(updated);
            }}
          />
        </div>

        {/* Right Section: Sidebar Cards (Performance, Description, Limits Summary) */}
        <div className="lg:col-span-4 space-y-5">
          <PlanPerformanceCard
            plan={currentPlan}
            onOpenAnalytics={() => toast.info(`Viewing analytics for ${currentPlan.name} plan`)}
          />

          <PlanDescriptionCard plan={currentPlan} />

          <PlanLimitsSummaryCard plan={currentPlan} />
        </div>
      </div>

      {/* 4. Bottom Sticky Action Bar */}
      <PlanBottomBar
        onCancel={onBack}
        onSave={handleBottomBarSave}
        isSaving={isSaving}
      />

      {/* 5. Modals */}
      <ComparePlansModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
      />

      <EditPlanDetailsModal
        plan={currentPlan}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePlan}
      />
    </div>
  );
}
