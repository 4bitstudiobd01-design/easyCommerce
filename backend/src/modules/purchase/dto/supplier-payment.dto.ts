import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierPaymentMethodEnum } from '../entities/supplier-payment.entity';

export class RecordSupplierPaymentDto {
  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  billId?: string;

  @IsDateString()
  paymentDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsEnum(SupplierPaymentMethodEnum)
  method?: SupplierPaymentMethodEnum;

  @IsOptional()
  @IsUUID()
  paidFromAccountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class ListSupplierPaymentsQueryDto {
  @IsOptional()
  @IsUUID()
  billId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
