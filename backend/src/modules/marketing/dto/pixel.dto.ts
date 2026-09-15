import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketingProviderEnum, PixelPageScopeModeEnum } from '../entities/marketing-pixel.entity';

/**
 * The provider secret bag. Keys are all optional — a merchant supplies only what
 * their provider needs. Sent on create/update, never returned. `null` / `''` on a
 * field is an explicit clear on update.
 */
export class PixelCredentialsDto {
  @ApiPropertyOptional({ description: 'Meta / TikTok CAPI access token' })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'GA4 Measurement Protocol API secret' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ description: 'Meta test event code' })
  @IsOptional()
  @IsString()
  testEventCode?: string;

  @ApiPropertyOptional({ description: 'Google Ads developer token' })
  @IsOptional()
  @IsString()
  developerToken?: string;

  @ApiPropertyOptional({ description: 'Google Ads OAuth client id' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Google Ads OAuth client secret' })
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @ApiPropertyOptional({ description: 'Google Ads OAuth refresh token' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class CreatePixelDto {
  @ApiProperty({ enum: MarketingProviderEnum, example: MarketingProviderEnum.META })
  @IsEnum(MarketingProviderEnum)
  provider: MarketingProviderEnum;

  @ApiProperty({ example: 'Retargeting Pixel', description: 'Unique per (store, provider)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label: string;

  @ApiProperty({ example: '1234567890', description: 'Pixel / measurement / dataset id' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  pixelId: string;

  @ApiPropertyOptional({ type: PixelCredentialsDto })
  @IsOptional()
  @IsObject()
  credentials?: PixelCredentialsDto;

  @ApiPropertyOptional({ description: 'Also dispatch events server-side when credentials exist' })
  @IsOptional()
  @IsBoolean()
  capiEnabled?: boolean;

  @ApiPropertyOptional({ enum: PixelPageScopeModeEnum, default: PixelPageScopeModeEnum.ALL })
  @IsOptional()
  @IsEnum(PixelPageScopeModeEnum)
  pageScopeMode?: PixelPageScopeModeEnum;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePixelDto {
  @ApiPropertyOptional({ example: 'Retargeting Pixel' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  pixelId?: string;

  @ApiPropertyOptional({
    type: PixelCredentialsDto,
    description: 'Omit to leave stored secrets untouched; send null to clear all; send a field as "" to clear that one',
    nullable: true,
  })
  @IsOptional()
  credentials?: PixelCredentialsDto | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  capiEnabled?: boolean;

  @ApiPropertyOptional({ enum: PixelPageScopeModeEnum })
  @IsOptional()
  @IsEnum(PixelPageScopeModeEnum)
  pageScopeMode?: PixelPageScopeModeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'CONNECTED keeps a pixel firing; DISCONNECTED pauses it but keeps config' })
  @IsOptional()
  @IsString()
  status?: 'CONNECTED' | 'DISCONNECTED';
}

export class TestPixelEventDto {
  @ApiProperty({ example: 'Purchase' })
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @ApiPropertyOptional({ example: '#ORD-TEST' })
  @IsOptional()
  @IsString()
  orderRef?: string;

  @ApiPropertyOptional({ description: 'Custom event payload; a sensible default is used when omitted' })
  @IsOptional()
  @IsObject()
  customPayload?: Record<string, unknown>;
}
