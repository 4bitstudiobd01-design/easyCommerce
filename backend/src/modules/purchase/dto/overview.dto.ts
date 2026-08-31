import { IsDateString, IsOptional } from 'class-validator';

export class PurchaseOverviewQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
