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

  @ApiProperty({ example: 'Daruchini Fashion', description: 'Store name — provide together with storeSlug to create the merchant\'s first store in the same request', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storeName?: string;

  @ApiProperty({ example: 'daruchini', description: 'Unique store URL slug / subdomain', required: false })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'storeSlug must contain only lowercase letters, numbers, and hyphens',
  })
  storeSlug?: string;

  @ApiProperty({ example: 'Fashion & Apparel', description: 'Store business category', required: false })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ example: 'Bangladesh', description: 'Store country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: true, description: 'Must be true — confirms the merchant accepted the Terms of Service and Privacy Policy' })
  @Equals(true, { message: 'You must accept the Terms of Service and Privacy Policy to register.' })
  acceptedTerms: boolean;
}
