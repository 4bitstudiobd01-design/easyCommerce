import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ReturnStatusEnum } from '../entities/return.entity';
import { ReturnItemConditionEnum } from '../entities/return-item.entity';

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatusEnum)
  status: ReturnStatusEnum;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  // For inspection step
  @IsEnum(ReturnItemConditionEnum)
  @IsOptional()
  condition?: ReturnItemConditionEnum;

  @IsString()
  @IsOptional()
  inspectionNote?: string;

  // For accept step
  @IsBoolean()
  @IsOptional()
  restockDecision?: boolean;
}
