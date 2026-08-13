import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'Samsung', description: 'Brand name' })
  @IsNotEmpty({ message: 'Brand name is required' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Leading global electronics manufacturer', description: 'Brand description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/brand-logo.png', description: 'Brand logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'samsung', description: 'Custom URL slug' })
  @IsOptional()
  @IsString()
  slug?: string;
}
