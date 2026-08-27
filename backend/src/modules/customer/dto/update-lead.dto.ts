import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateLeadDto } from './create-lead.dto';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
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

export class UpdateLeadDetailsDto {
  @ApiProperty({ example: 'Interested in bulk t-shirt order for corporate event', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 15000, description: 'Estimated potential deal value in BDT', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;
}
