import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Warehouse Operations' })
  @IsString()
  @IsNotEmpty({ message: 'Department name is required' })
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Handles inbound/outbound stock and packing.' })
  @IsOptional()
  @IsString()
  description?: string;
}
