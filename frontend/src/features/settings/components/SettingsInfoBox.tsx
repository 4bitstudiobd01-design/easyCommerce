import React from 'react';
import { Info } from 'lucide-react';

interface SettingsInfoBoxProps {
  text: React.ReactNode;
}

export function SettingsInfoBox({ text }: SettingsInfoBoxProps) {
  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      <p className="text-[11px] font-medium text-blue-900 leading-snug">{text}</p>
    </div>
  );
}
