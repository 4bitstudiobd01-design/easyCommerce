import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceInvoiceStatusEnum,
  FinanceBillStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';

export class ListTransactionsQueryDto {
  @IsEnum(FinanceTransactionTypeEnum)
  @IsOptional()
  type?: FinanceTransactionTypeEnum;

  @IsEnum(FinanceTransactionStatusEnum)
  @IsOptional()
  status?: FinanceTransactionStatusEnum;

  @IsEnum(FinanceSourceTypeEnum)
  @IsOptional()
  sourceType?: FinanceSourceTypeEnum;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  categoryCode?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

export class ListInvoicesQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

export class ListBillsQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

export class FinanceReportQueryDto {
  @IsString()
  @IsOptional()
  period?: 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom' = 'this_month';

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
