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
import { FinanceInvoiceStatusEnum } from '../enums/finance.enums';

export class CreateFinanceInvoiceItemDto {
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

  @IsUUID()
  @IsOptional()
  productId?: string;
}

export class CreateFinanceInvoiceDto {
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsString()
  @IsNotEmpty()
  issueDate: string;

  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  discountAmount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(FinanceInvoiceStatusEnum)
  @IsOptional()
  status?: FinanceInvoiceStatusEnum;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFinanceInvoiceItemDto)
  items: CreateFinanceInvoiceItemDto[];
}

export class RecordInvoicePaymentDto {
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

export class UpdateFinanceInvoiceStatusDto {
  @IsEnum(FinanceInvoiceStatusEnum)
  @IsNotEmpty()
  status: FinanceInvoiceStatusEnum;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentDate?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
