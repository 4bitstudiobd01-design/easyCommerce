import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDeliveryZoneDto {
  @ApiProperty({ example: 'Inside Dhaka' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ['dhaka', 'dhanmondi', 'gulshan'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];

  @ApiProperty({ example: 60 })
  @IsNumber()
  @Min(0)
  deliveryCharge: number;

  @ApiProperty({ example: '1-2 days', required: false })
  @IsOptional()
  @IsString()
  estimatedDeliveryTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDeliveryZoneDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryCharge?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  estimatedDeliveryTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
