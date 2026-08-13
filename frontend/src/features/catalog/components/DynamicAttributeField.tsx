'use client';

import React from 'react';
import { AttributeDefinition } from '../api/catalogApi';

interface DynamicAttributeFieldProps {
  attribute: AttributeDefinition;
  value: any;
  onChange: (value: any) => void;
}

export function DynamicAttributeField({ attribute, value, onChange }: DynamicAttributeFieldProps) {
  const { name, type, description, isRequired, options = [] } = attribute;

  const renderInput = () => {
    switch (type) {
      case 'NUMBER':
        return (
          <input
            type="number"
            value={value !== undefined && value !== null ? value : ''}
            onChange={(e) => onChange(e.target.value !== '' ? Number(e.target.value) : '')}
            placeholder={`Enter ${name.toLowerCase()}...`}
            required={isRequired}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        );

      case 'BOOLEAN':
        return (
          <label className="inline-flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={Boolean(value === true || value === 'true')}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="text-xs font-semibold text-slate-800">
              {value === true || value === 'true' ? 'Yes / Enabled' : 'No / Disabled'}
            </span>
          </label>
        );

      case 'SELECT':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">-- Select {name} --</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'MULTI_SELECT': {
        const selectedList: string[] = Array.isArray(value)
          ? value
          : typeof value === 'string'
          ? (function () {
              try {
                return JSON.parse(value);
              } catch {
                return value.split(',').map((s) => s.trim());
              }
            })()
          : [];

        const toggleItem = (label: string) => {
          if (selectedList.includes(label)) {
            onChange(selectedList.filter((item) => item !== label));
          } else {
            onChange([...selectedList, label]);
          }
        };

        return (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {options.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No options configured for this multi-select attribute.</p>
            ) : (
              options.map((opt) => {
                const isChecked = selectedList.includes(opt.label);
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer text-xs transition-all ${
                      isChecked
                        ? 'bg-blue-50/60 border-blue-300 font-bold text-blue-900'
                        : 'bg-slate-50/50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(opt.label)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })
            )}
          </div>
        );
      }

      case 'DATE':
        return (
          <input
            type="date"
            value={value ? String(value).slice(0, 10) : ''}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        );

      case 'URL':
        return (
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/spec-sheet.pdf"
            required={isRequired}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        );

      case 'TEXT':
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${name.toLowerCase()}...`}
            required={isRequired}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {name}
          {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">
          {type}
        </span>
      </div>

      {renderInput()}

      {description && <p className="text-[11px] text-slate-400 leading-tight">{description}</p>}
    </div>
  );
}
