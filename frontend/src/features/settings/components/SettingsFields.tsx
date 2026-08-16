'use client';

import React from 'react';

/** A titled group of related fields inside a settings page. */
export function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">{title}</h2>
        {description && (
          <p className="text-[11.5px] font-medium text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/** Row-style boolean switch with label + helper text. */
export function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${
        disabled
          ? 'border-slate-200 bg-slate-50/60 cursor-not-allowed'
          : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
      }`}
    >
      <div className="min-w-0">
        <span className="block text-[12.5px] font-bold text-slate-900 leading-tight">{label}</span>
        {description && (
          <span className="block text-[11.5px] font-medium text-slate-500 mt-1 leading-relaxed">
            {description}
          </span>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative w-11 h-6 rounded-full shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-slate-300'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

const inputClass =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  type = 'text',
  min,
  required = false,
}: {
  label: string;
  value: string | number;
  onChange: (next: string) => void;
  placeholder?: string;
  helper?: string;
  type?: string;
  min?: number;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11.5px] font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      {helper && <p className="text-[11px] font-medium text-slate-400">{helper}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  helper?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11.5px] font-bold text-slate-700">{label}</label>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} resize-y`}
      />
      {helper && <p className="text-[11px] font-medium text-slate-400">{helper}</p>}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  helper,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  helper?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11.5px] font-bold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} cursor-pointer`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helper && <p className="text-[11px] font-medium text-slate-400">{helper}</p>}
    </div>
  );
}
