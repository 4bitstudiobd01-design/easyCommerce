'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { SettingsHeader } from './SettingsHeader';
import { SettingsTabsNav } from './SettingsTabsNav';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { OtherSettingsTabs } from './OtherSettingsTabs';
import { PlatformPreviewCard } from './PlatformPreviewCard';
import { QuickLinksCard } from './QuickLinksCard';
import { SystemStatusCard } from './SystemStatusCard';
import { ClearCacheModal } from './ClearCacheModal';
import { ResetSettingsModal } from './ResetSettingsModal';
import { INITIAL_GENERAL_SETTINGS } from './settingsMockData';
import { SettingsTab, GeneralSettings } from './types';

export function PlatformSettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  const [settings, setSettings] = useState<GeneralSettings>(INITIAL_GENERAL_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [isClearCacheOpen, setIsClearCacheOpen] = useState(false);
  const [isResetSettingsOpen, setIsResetSettingsOpen] = useState(false);

  const handleSettingChange = (key: keyof GeneralSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Platform settings saved and synchronized successfully!');
    }, 450);
  };

  const handleConfirmReset = () => {
    setSettings(INITIAL_GENERAL_SETTINGS);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Title, Subtitle and Save Changes Action */}
      <SettingsHeader isSaving={isSaving} onSave={handleSaveChanges} />

      {/* 2. Settings Tabs Navigation Bar */}
      <SettingsTabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Main Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Column: Active Tab Content (Takes all available space) */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {activeTab === 'General' ? (
            <GeneralSettingsTab
              settings={settings}
              onChange={handleSettingChange}
              onClearCache={() => setIsClearCacheOpen(true)}
              onResetSettings={() => setIsResetSettingsOpen(true)}
            />
          ) : (
            <OtherSettingsTabs activeTab={activeTab} />
          )}
        </div>

        {/* Right Column: Platform Preview, Quick Links, System Status */}
        <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 space-y-5">
          {/* Card 1: Live Platform Preview */}
          <PlatformPreviewCard
            platformName={settings.platformName}
            tagline={settings.tagline}
          />

          {/* Card 2: Quick Links */}
          <QuickLinksCard />

          {/* Card 3: System Status */}
          <SystemStatusCard />
        </div>
      </div>

      {/* 4. Modals */}
      <ClearCacheModal
        isOpen={isClearCacheOpen}
        onClose={() => setIsClearCacheOpen(false)}
        onConfirm={() => {}}
      />

      <ResetSettingsModal
        isOpen={isResetSettingsOpen}
        onClose={() => setIsResetSettingsOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
