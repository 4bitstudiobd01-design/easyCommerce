/**
 * Maps a human colour name (from a variant option label like "Purple" or
 * "Sand / Orange") to a CSS colour, so the product page can render a real
 * swatch even though the backend never stores a hex value on attribute options.
 * Falls back to a neutral grey when the label isn't a recognisable colour.
 */
const NAMED_COLORS: Record<string, string> = {
  black: '#111827',
  white: '#f8fafc',
  ivory: '#fffff0',
  cream: '#f5f0e1',
  beige: '#e8dcc4',
  sand: '#e3d5b8',
  grey: '#9ca3af',
  gray: '#9ca3af',
  silver: '#c0c0c0',
  charcoal: '#36454f',
  slate: '#64748b',
  navy: '#1e3a5f',
  blue: '#2563eb',
  'sky blue': '#38bdf8',
  'light blue': '#7dd3fc',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  green: '#16a34a',
  olive: '#708238',
  lime: '#84cc16',
  mint: '#a7f3d0',
  yellow: '#facc15',
  gold: '#d4af37',
  mustard: '#e1ad01',
  orange: '#f97316',
  coral: '#fb7185',
  peach: '#ffc5a1',
  red: '#dc2626',
  maroon: '#7f1d1d',
  burgundy: '#800020',
  pink: '#ec4899',
  rose: '#f43f5e',
  fuchsia: '#d946ef',
  purple: '#9333ea',
  violet: '#8b5cf6',
  lavender: '#c4b5fd',
  indigo: '#4f46e5',
  brown: '#92400e',
  tan: '#d2b48c',
  khaki: '#c3b091',
  chocolate: '#5c4033',
  bronze: '#cd7f32',
};

/** Best-effort CSS colour for a variant option label. null = not a colour. */
export function resolveSwatchColor(label: string | undefined | null): string | null {
  if (!label) return null;
  const key = label.trim().toLowerCase();
  if (NAMED_COLORS[key]) return NAMED_COLORS[key];

  // "Sand / Orange", "Blue-Grey" etc. — take the first recognisable token.
  const tokens = key.split(/[\s/\-,]+/).filter(Boolean);
  for (const token of tokens) {
    if (NAMED_COLORS[token]) return NAMED_COLORS[token];
  }
  // Raw hex passed straight through ("#abc123").
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(key)) return key;
  return null;
}

/** True when an attribute name reads like a colour picker. */
export function isColorAttribute(attributeName: string | undefined | null): boolean {
  if (!attributeName) return false;
  return /colou?r/i.test(attributeName);
}
