export type SettingsTab =
  | 'General'
  | 'Branding'
  | 'Email'
  | 'Payments'
  | 'Notifications'
  | 'Registration'
  | 'Features'
  | 'Security'
  | 'Maintenance'
  | 'Advanced';

export interface GeneralSettings {
  // Platform Info
  platformName: string;
  tagline: string;
  platformDescription: string;
  defaultTimezone: string;
  defaultLanguage: string;

  // Business Info
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
  companyAddress: string;

  // Regional & Currency
  defaultCurrency: string;
  currencyPosition: string;
  decimalFormat: string;

  // System Defaults
  defaultPlan: string;
  defaultStoreStatus: string;
  defaultOrderStatus: string;
  defaultSubscriptionStatus: string;
  dataExportFormat: string;
  itemsPerPage: number;
  enable2FA: boolean;
}

export interface BrandingSettings {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  darkLogoUrl?: string;
  brandTagline: string;
  customCss?: string;
}

export interface EmailSettings {
  senderName: string;
  senderEmail: string;
  smtpHost: string;
  smtpPort: number;
  encryption: 'TLS' | 'SSL' | 'None';
  enableEmailVerification: boolean;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  provider: 'bKash' | 'Nagad' | 'SSLCommerz' | 'Stripe' | 'AmarPay';
  status: 'Active' | 'Inactive' | 'Test Mode';
  feePercentage: number;
  fixedFee: number;
}

export interface SystemStatusData {
  currentVersion: string;
  lastUpdated: string;
  databaseStatus: 'Healthy' | 'Degraded' | 'Critical';
  storageUsedGB: number;
  storageTotalGB: number;
  activeBackgroundJobs: number;
}

export interface QuickLinkItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  href: string;
}
