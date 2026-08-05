export interface ResponsiveBreakpointSpan {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface DashboardLayoutConfig {
  gridColumns: number;
  sectionGapPx: number;
  cardBorderRadiusClass: string;
  defaultMetricSpan: ResponsiveBreakpointSpan;
  defaultHalfWidthSpan: ResponsiveBreakpointSpan;
  defaultFullWidthSpan: ResponsiveBreakpointSpan;
}

export const DASHBOARD_LAYOUT: DashboardLayoutConfig = {
  gridColumns: 12,
  sectionGapPx: 32,
  cardBorderRadiusClass: 'rounded-3xl',
  defaultMetricSpan: { sm: 12, md: 6, lg: 3, xl: 3 },
  defaultHalfWidthSpan: { sm: 12, md: 12, lg: 6, xl: 6 },
  defaultFullWidthSpan: { sm: 12, md: 12, lg: 12, xl: 12 },
};
