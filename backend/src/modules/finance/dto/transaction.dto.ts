import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FinanceTransactionTypeEnum,
  FinanceTransactionStatusEnum,
  FinanceSourceTypeEnum,
} from '../enums/finance.enums';

export class CreateFinanceTransactionDto {
  @IsEnum(FinanceTransactionTypeEnum)
  type: FinanceTransactionTypeEnum;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  transactionDate?: string;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsUUID()
  @IsOptional()
  toAccountId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  categoryCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsEnum(FinanceSourceTypeEnum)
  @IsOptional()
  sourceType?: FinanceSourceTypeEnum;

  @IsUUID()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsEnum(FinanceTransactionStatusEnum)
  @IsOptional()
  status?: FinanceTransactionStatusEnum;

  @IsUUID()
  @IsOptional()
  receiptFileId?: string;
}

export class CreateIncomeDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  transactionDate?: string;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  categoryCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class CreateExpenseDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  transactionDate?: string;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  categoryCode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsUUID()
  @IsOptional()
  receiptFileId?: string;
}
