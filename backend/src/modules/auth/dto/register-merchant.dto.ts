import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, Matches, Length, Equals } from 'class-validator';

export class RegisterMerchantDto {
  @ApiProperty({ example: 'owner@mystore.com', description: 'Merchant email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Secret123!', description: 'Password (min 6 chars)' })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'Rahim Uddin', description: 'Full Name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: '01700000000', description: 'Bangladeshi mobile number', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+?88)?01[3-9]\d{8}$/, {
    message: 'phone must be a valid Bangladeshi mobile number, e.g. 01700000000',
  })
  phone?: string;

  @ApiProperty({ example: 'Daruchini Fashion', description: 'Store name', required: false })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiProperty({ example: 'daruchini', description: 'Store subdomain slug', required: false })
  @IsOptional()
  @IsString()
  storeSlug?: string;

  @ApiProperty({ example: 'daruchini', description: 'Store subdomain slug alias', required: false })
  @IsOptional()
  @IsString()
  subdomain?: string;

  @ApiProperty({ example: 'Fashion & Apparel', description: 'Store business category', required: false })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ example: 'Fashion & Apparel', description: 'Business category alias', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'Bangladesh', description: 'Store country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Dhaka, Bangladesh', description: 'Store address / location', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: true, description: 'Accept terms of service', required: false })
  @IsOptional()
  acceptedTerms?: boolean;
}
