import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject, IsArray } from 'class-validator';

export class UpdatePlatformConfigDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  heroContent?: {
    title?: string;
    subtitle?: string;
    ctaPrimaryText?: string;
    ctaPrimaryLink?: string;
    ctaSecondaryText?: string;
    ctaSecondaryLink?: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  pricingPlans?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  testimonials?: any[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  faqs?: any[];
}
