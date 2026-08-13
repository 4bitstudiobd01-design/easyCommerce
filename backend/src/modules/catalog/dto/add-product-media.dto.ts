import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class AddProductMediaDto {
  @ApiProperty({ example: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', description: 'Product image URL' })
  @IsNotEmpty({ message: 'Media URL is required' })
  @IsString({ message: 'Media URL must be a string' })
  url: string;

  @ApiPropertyOptional({ example: 'Front view of cotton shirt', description: 'Image alt text' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ example: true, description: 'Set as primary image' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Sort order index' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
