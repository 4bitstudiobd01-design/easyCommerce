import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, IsArray, Min } from 'class-validator';
import { LeadSourceEnum, LeadStageEnum } from '../entities/lead.entity';

export class CreateLeadDto {
  @ApiProperty({ example: 'Tanvir Ahmed', description: 'Lead contact name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '01712345678', description: 'Lead contact phone' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'tanvir@gmail.com', description: 'Lead contact email', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'Apex Holdings', description: 'Company name', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ enum: LeadSourceEnum, default: LeadSourceEnum.WHATSAPP, required: false })
  @IsOptional()
  @IsEnum(LeadSourceEnum)
  source?: LeadSourceEnum;

  @ApiProperty({ enum: LeadStageEnum, default: LeadStageEnum.NEW, required: false })
  @IsOptional()
  @IsEnum(LeadStageEnum)
  stage?: LeadStageEnum;

  @ApiProperty({ example: 4500, description: 'Estimated potential deal value in BDT', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedValue?: number;

  @ApiProperty({ example: 70, description: 'Lead priority score (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  leadScore?: number;

  @ApiProperty({ example: 'Looking for bulk t-shirt inquiry for event', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: ['VIP', 'Bulk', 'Corporate'], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: 'Assigned staff UUID', required: false })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @ApiProperty({ description: 'Assigned staff name', required: false })
  @IsOptional()
  @IsString()
  assignedStaffName?: string;
}
