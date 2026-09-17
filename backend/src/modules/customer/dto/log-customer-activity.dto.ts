import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ManualActivityTypeEnum {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  NOTE = 'NOTE',
  MEETING = 'MEETING',
}

export class LogCustomerActivityDto {
  @ApiProperty({ enum: ManualActivityTypeEnum, description: 'Type of manual interaction being logged' })
  @IsEnum(ManualActivityTypeEnum)
  type: ManualActivityTypeEnum;

  @ApiProperty({ description: 'Short activity title' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Summary details of the interaction' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ description: 'Outcome of the interaction, e.g. Completed, No Answer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  outcome?: string;
}
