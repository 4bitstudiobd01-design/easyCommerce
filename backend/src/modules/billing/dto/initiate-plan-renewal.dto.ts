import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PlanCodeEnum } from '../entities/plan.entity';

export class InitiatePlanRenewalDto {
  @ApiProperty({ enum: PlanCodeEnum, example: PlanCodeEnum.GROWTH })
  @IsEnum(PlanCodeEnum)
  planCode: PlanCodeEnum;
}
