import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';

export class SubscribeNewsletterDto {
  @ApiProperty({ example: 'my-store-slug' })
  @IsNotEmpty()
  @IsString()
  storeSlug: string;

  @ApiProperty({ example: 'customer@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Customer Name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'STOREFRONT_FOOTER', required: false })
  @IsOptional()
  @IsString()
  source?: string;
}
