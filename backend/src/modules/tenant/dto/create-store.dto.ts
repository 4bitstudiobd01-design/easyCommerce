import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Matches, Length } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'Daruchini Fashion', description: 'Name of the merchant store' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'daruchini', description: 'Unique store URL slug / subdomain' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @ApiProperty({ example: 'Fashion & Apparel', description: 'Store category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'Bangladesh', description: 'Store country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: '+8801700000000', description: 'Store phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh', description: 'Store physical address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', description: 'Store logo URL', required: false })
  @IsOptional()
  @IsString()
  logo?: string;
}
