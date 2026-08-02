import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, IsArray } from 'class-validator';
import { SmsDriverEnum, EmailDriverEnum, HeroBannerItem } from '../entities/store.entity';

export class UpdateStoreDto {
  @ApiProperty({ example: 'My Online Fashion Store', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '01700000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Dhanmondi, Dhaka', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'https://example.com/logo.png', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: 'https://example.com/favicon.ico', required: false })
  @IsOptional()
  @IsString()
  favicon?: string;

  @ApiProperty({ example: 'Sumon Fashion - Premium Apparel Store', required: false })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({ example: 'Shop top quality clothing online with fast BD delivery.', required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  // Marketing Pixels & Conversions API
  @ApiProperty({ example: '123456789012345', required: false })
  @IsOptional()
  @IsString()
  facebookPixelId?: string;

  @ApiProperty({ example: 'EAAG...', required: false })
  @IsOptional()
  @IsString()
  facebookCapiToken?: string;

  @ApiProperty({ example: 'TEST12345', required: false })
  @IsOptional()
  @IsString()
  facebookTestEventCode?: string;

  @ApiProperty({ example: 'C1234567890', required: false })
  @IsOptional()
  @IsString()
  tiktokPixelId?: string;

  @ApiProperty({ example: 'GTM-XXXXXXX', required: false })
  @IsOptional()
  @IsString()
  googleTagManagerId?: string;

  @ApiProperty({ example: 'G-1234567890', required: false })
  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;

  @ApiProperty({ example: 'snap_pixel_123', required: false })
  @IsOptional()
  @IsString()
  snapchatPixelId?: string;

  @ApiProperty({ example: 'pin_tag_456', required: false })
  @IsOptional()
  @IsString()
  pinterestTagId?: string;

  @ApiProperty({ example: '#2563eb', required: false })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({ example: 'Inter', required: false })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  heroBanners?: HeroBannerItem[];

  @ApiProperty({ example: 'www.sumonfashion.com', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'BDT', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'sf_api_key_123', required: false })
  @IsOptional()
  @IsString()
  steadfastApiKey?: string;

  @ApiProperty({ example: 'sf_secret_key_456', required: false })
  @IsOptional()
  @IsString()
  steadfastSecretKey?: string;

  @ApiProperty({ example: 'pth_client_id_789', required: false })
  @IsOptional()
  @IsString()
  pathaoClientId?: string;

  @ApiProperty({ example: 'pth_client_secret_012', required: false })
  @IsOptional()
  @IsString()
  pathaoClientSecret?: string;

  // Notification Drivers (SMS & Email)
  @ApiProperty({ enum: SmsDriverEnum, required: false })
  @IsOptional()
  @IsEnum(SmsDriverEnum)
  smsDriver?: SmsDriverEnum;

  @ApiProperty({ example: 'sms_api_key_123', required: false })
  @IsOptional()
  @IsString()
  smsApiKey?: string;

  @ApiProperty({ example: 'EASYSTORE', required: false })
  @IsOptional()
  @IsString()
  smsSenderId?: string;

  @ApiProperty({ enum: EmailDriverEnum, required: false })
  @IsOptional()
  @IsEnum(EmailDriverEnum)
  emailDriver?: EmailDriverEnum;

  @ApiProperty({ example: 'smtp.mailtrap.io', required: false })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiProperty({ example: 587, required: false })
  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @ApiProperty({ example: 'smtp_user', required: false })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiProperty({ example: 'smtp_pass', required: false })
  @IsOptional()
  @IsString()
  smtpPass?: string;

  @ApiProperty({ example: 'no-reply@store.com', required: false })
  @IsOptional()
  @IsString()
  fromEmail?: string;
}
