import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFinanceSettingsDto {
  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  currencySymbol?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  defaultTaxRate?: number;

  @IsString()
  @IsOptional()
  taxNumber?: string;

  @IsString()
  @IsOptional()
  invoicePrefix?: string;

  @IsString()
  @IsOptional()
  billPrefix?: string;

  @IsUUID()
  @IsOptional()
  defaultSalesAccountId?: string;

  @IsUUID()
  @IsOptional()
  defaultExpenseAccountId?: string;

  @IsString()
  @IsOptional()
  invoiceFooterNote?: string;

  @IsString()
  @IsOptional()
  invoiceTerms?: string;
}
