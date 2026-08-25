import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsHexColor, IsMilitaryTime, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '09:00' })
  @IsMilitaryTime()
  startTime: string;

  @ApiProperty({ example: '17:00' })
  @IsMilitaryTime()
  endTime: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @IsHexColor()
  colorTag?: string;
}

export class UpdateShiftDto {
  @ApiPropertyOptional({ example: 'Morning Shift' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsMilitaryTime()
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @IsMilitaryTime()
  endTime?: string;

  @ApiPropertyOptional({ example: '#2563EB' })
  @IsOptional()
  @IsHexColor()
  colorTag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
