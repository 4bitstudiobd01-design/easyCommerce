export interface ProductFormTab {
  id: string;
  label: string;
}

export const PRODUCT_FORM_TABS: ProductFormTab[] = [
  { id: 'general', label: 'General' },
  { id: 'media', label: 'Media' },
  { id: 'organization', label: 'Category & Brand' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'variants', label: 'Variants' },
  { id: 'shipping', label: 'Shipping' },
];

export const DEFAULT_PRODUCT_FORM_TAB = 'general';
