import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateLeadDto } from './create-lead.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStageEnum } from '../entities/lead.entity';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiProperty({ example: 'Client decided to postpone purchase', required: false })
  @IsOptional()
  @IsString()
  lostReason?: string;
}

export class UpdateLeadStageDto {
  @ApiProperty({ enum: LeadStageEnum, example: LeadStageEnum.QUALIFIED })
  @IsEnum(LeadStageEnum)
  stage: LeadStageEnum;

  @ApiProperty({ example: 'Customer was not interested in pricing', required: false })
  @IsOptional()
  @IsString()
  lostReason?: string;
}
