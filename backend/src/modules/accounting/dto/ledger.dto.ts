import { IsDateString, IsOptional, IsUUID } from 'class-validator';

/**
 * Query params for the General Ledger view (`GET /accounting/ledger`).
 * One account, an optional inclusive date window. Only POSTED journal lines are aggregated.
 */
export class LedgerQueryDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
