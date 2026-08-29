import { IsDateString, IsOptional } from 'class-validator';

/**
 * Query params for the Profit & Loss report (`GET /accounting/reports/profit-loss`).
 * An inclusive date window [from, to]. When either bound is omitted the service falls
 * back to fiscal-year-to-date (the fiscal year containing today, per the store's
 * `fiscalYearStartMonth`, through today). P&L is a flow statement — movement only,
 * POSTED entries only.
 */
export class ProfitLossQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

/**
 * Query params for the Balance Sheet report (`GET /accounting/reports/balance-sheet`).
 * A single point in time; defaults to today. Cumulative from inception through `asOf`,
 * POSTED entries only.
 */
export class BalanceSheetQueryDto {
  @IsOptional()
  @IsDateString()
  asOf?: string;
}
