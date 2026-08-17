import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PlanCodeEnum } from '../entities/plan.entity';

export class ChangePlanDto {
  @ApiProperty({
    enum: PlanCodeEnum,
    example: PlanCodeEnum.FREE,
    description: 'Plan to move down to. Upgrades go through the renewal payment flow instead.',
  })
  @IsEnum(PlanCodeEnum)
  planCode: PlanCodeEnum;
}
