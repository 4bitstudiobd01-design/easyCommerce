export interface GlobalDashboardConfig {
  appName: string;
  defaultPollingIntervalMs: number;
  maxRetryAttempts: number;
  toastDurationMs: number;
  enableRealtimeStream: boolean;
  enableAuditLogging: boolean;
  supportedCurrencies: string[];
}

export const DASHBOARD_CONFIG: GlobalDashboardConfig = {
  appName: 'EasyCommerce Super Admin',
  defaultPollingIntervalMs: 30000,
  maxRetryAttempts: 3,
  toastDurationMs: 4000,
  enableRealtimeStream: false,
  enableAuditLogging: true,
  supportedCurrencies: ['BDT', 'USD'],
};
