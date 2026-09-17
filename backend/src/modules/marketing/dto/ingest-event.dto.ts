import { IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IngestEventDto {
  @ApiProperty({ example: 'mystore' })
  @IsString()
  storeSlug: string;

  @ApiProperty({ format: 'uuid', description: 'The MarketingPixel this event was fired through' })
  @IsUUID()
  pixelId: string;

  @ApiProperty({ example: 'ViewContent' })
  @IsString()
  @MaxLength(100)
  eventName: string;

  @ApiPropertyOptional({ example: '/product/silk-panjabi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pagePath?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'storefront_sessions.sessionId, when known' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional({ example: '#EC-1042' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  orderRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
