import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  IsArray,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FinanceRequisitionStatusEnum,
  FinanceRequisitionPriorityEnum,
} from '../enums/finance.enums';
import { FinanceRequisitionItem } from '../entities/finance-requisition.entity';

export class CreateFinanceRequisitionDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ValidateIf((o) => Boolean(o.purchaseOrderId))
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  poNumber?: string;

  @ValidateIf((o) => Boolean(o.supplierId))
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierName?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  requestedAmount: number;

  @IsString()
  requestDate: string;

  @IsOptional()
  @IsString()
  requiredDate?: string;

  @IsOptional()
  @IsEnum(FinanceRequisitionPriorityEnum)
  priority?: FinanceRequisitionPriorityEnum;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  items?: FinanceRequisitionItem[];
}

export class ApproveFinanceRequisitionDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectFinanceRequisitionDto {
  @IsString()
  reason: string;
}

export class ListRequisitionsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(FinanceRequisitionStatusEnum)
  status?: FinanceRequisitionStatusEnum;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
