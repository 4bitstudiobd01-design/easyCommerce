import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty({ example: 'Independence Day' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: '2026-03-26' })
  @IsDateString()
  date: string;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional({ example: 'Independence Day' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: '2026-03-26' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class ListHolidaysQueryDto {
  @ApiPropertyOptional({ example: 2026, description: 'Defaults to the current year if omitted' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;
}
