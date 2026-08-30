import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FinanceBillStatusEnum } from '../enums/finance.enums';

export class CreateFinanceBillItemDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  unitPrice: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  taxRate?: number;
}

export class CreateFinanceBillDto {
  @IsString()
  @IsOptional()
  billNumber?: string;

  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @IsString()
  @IsOptional()
  supplierContact?: string;

  @IsString()
  @IsOptional()
  supplierEmail?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsNotEmpty()
  issueDate: string;

  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(FinanceBillStatusEnum)
  @IsOptional()
  status?: FinanceBillStatusEnum;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  attachmentFileId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFinanceBillItemDto)
  items: CreateFinanceBillItemDto[];
}

export class RecordBillPaymentDto {
  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentDate: string;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
