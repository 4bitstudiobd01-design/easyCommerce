import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Main Dhaka Warehouse', description: 'Warehouse location name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'WH-DHAKA-01', description: 'Warehouse unique code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: true, description: 'Is default fulfillment warehouse', required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ example: 'Dhaka, Bangladesh', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '+8801700000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
