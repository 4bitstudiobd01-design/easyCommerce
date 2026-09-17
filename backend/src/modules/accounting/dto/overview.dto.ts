import { IsDateString, IsOptional } from 'class-validator';

/**
 * Query params for the Accounting Overview landing page
 * (`GET /accounting/overview`).
 *
 * An inclusive date window [from, to] driving the flow KPIs, the comparison
 * against the immediately-preceding period of equal length, and the trend chart.
 * When either bound is omitted the service defaults to the current calendar
 * month (the 1st of this month through today). All financial aggregation is
 * POSTED-only.
 */
export class AccountingOverviewQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
