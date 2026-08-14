import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketingProviderEnum } from '../entities/marketing-pixel.entity';
import { MarketingEventNameEnum } from '../entities/marketing-event-config.entity';

export class ConnectPixelDto {
  @ApiProperty({ enum: MarketingProviderEnum })
  @IsEnum(MarketingProviderEnum)
  provider: MarketingProviderEnum;

  @ApiProperty()
  @IsString()
  pixelId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  accessToken?: string;
}

export class ToggleEventConfigDto {
  @ApiProperty({ enum: MarketingEventNameEnum })
  @IsEnum(MarketingEventNameEnum)
  eventName: MarketingEventNameEnum;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
