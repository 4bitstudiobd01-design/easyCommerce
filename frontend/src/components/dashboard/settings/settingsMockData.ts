import { GeneralSettings, SystemStatusData, QuickLinkItem } from './types';

export const INITIAL_GENERAL_SETTINGS: GeneralSettings = {
  // Platform Info
  platformName: 'EasyCommerce',
  tagline: 'All-in-one eCommerce Platform',
  platformDescription:
    'EasyCommerce helps businesses launch, manage and grow their online stores with powerful features and seamless integrations.',
  defaultTimezone: '(UTC+06:00) Dhaka, Bangladesh',
  defaultLanguage: 'English (US)',

  // Business Info
  companyName: 'EasyCommerce Ltd.',
  companyEmail: 'support@easyco.com',
  companyPhone: '+880 1712-345678',
  companyWebsite: 'https://www.easyco.com',
  companyAddress: 'House 23, Road 12, Banani, Dhaka 1213, Bangladesh',

  // Regional & Currency
  defaultCurrency: 'BDT (৳) - Bangladeshi Taka',
  currencyPosition: 'Before amount (৳1,000)',
  decimalFormat: '1,234.56',

  // System Defaults
  defaultPlan: 'Starter Plan',
  defaultStoreStatus: 'Pending Verification',
  defaultOrderStatus: 'Pending',
  defaultSubscriptionStatus: 'Active',
  dataExportFormat: 'CSV',
  itemsPerPage: 20,
  enable2FA: true,
};

export const SYSTEM_STATUS_DATA: SystemStatusData = {
  currentVersion: 'v2.1.0',
  lastUpdated: 'Aug 14, 2026 10:32 AM',
  databaseStatus: 'Healthy',
  storageUsedGB: 45.2,
  storageTotalGB: 200,
  activeBackgroundJobs: 23,
};

export const QUICK_LINKS: QuickLinkItem[] = [
  {
    id: 'link-gateways',
    title: 'Payment Gateways',
    description: 'Manage platform payment integrations',
    iconName: 'CreditCard',
    href: '/admin/integrations',
  },
  {
    id: 'link-email',
    title: 'Email Templates',
    description: 'Customize platform email templates',
    iconName: 'Mail',
    href: '/admin/notifications',
  },
  {
    id: 'link-backup',
    title: 'Backup & Restore',
    description: 'Manage database backups and restore',
    iconName: 'Database',
    href: '/admin/maintenance',
  },
  {
    id: 'link-api',
    title: 'API Keys',
    description: 'Manage platform API keys',
    iconName: 'Key',
    href: '/admin/security',
  },
];
