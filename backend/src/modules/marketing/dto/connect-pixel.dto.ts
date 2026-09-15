import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketingProviderEnum } from '../entities/marketing-pixel.entity';

export class ConnectPixelDto {
  @ApiProperty({ enum: MarketingProviderEnum, example: MarketingProviderEnum.META })
  @IsEnum(MarketingProviderEnum)
  @IsNotEmpty()
  provider: MarketingProviderEnum;

  @ApiProperty({ example: '8492049281', description: 'Pixel ID, Measurement ID, or Conversion Tag' })
  @IsString()
  @IsNotEmpty()
  pixelId: string;

  @ApiPropertyOptional({ example: 'EAABwz...', description: 'Conversions API Access Token or API Secret' })
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiPropertyOptional({ example: 'TEST12345', description: 'Meta Test Event Code' })
  @IsString()
  @IsOptional()
  testEventCode?: string;
}
