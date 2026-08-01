import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { DiscountTypeEnum } from '../entities/coupon.entity';

export class CreateCouponDto {
  @ApiProperty({ example: 'EASY20' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ enum: DiscountTypeEnum, example: DiscountTypeEnum.PERCENTAGE })
  @IsNotEmpty()
  @IsEnum(DiscountTypeEnum)
  discountType: DiscountTypeEnum;

  @ApiProperty({ example: 20 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({ example: 500, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ example: '2026-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}
