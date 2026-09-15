import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketingEventNameEnum } from '../entities/marketing-event-config.entity';
import { MarketingProviderEnum } from '../entities/marketing-pixel.entity';

export class DispatchTestEventDto {
  @ApiProperty({ enum: MarketingEventNameEnum, example: MarketingEventNameEnum.AddToCart })
  @IsEnum(MarketingEventNameEnum)
  @IsNotEmpty()
  eventName: MarketingEventNameEnum;

  @ApiPropertyOptional({ enum: MarketingProviderEnum, example: MarketingProviderEnum.META })
  @IsEnum(MarketingProviderEnum)
  @IsOptional()
  provider?: MarketingProviderEnum;

  @ApiPropertyOptional({ example: '#ORD-9281' })
  @IsString()
  @IsOptional()
  orderRef?: string;

  @ApiPropertyOptional({ example: { value: 1450, currency: 'BDT' } })
  @IsOptional()
  customPayload?: Record<string, any>;
}
