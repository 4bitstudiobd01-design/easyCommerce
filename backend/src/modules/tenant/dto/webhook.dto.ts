import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { WebhookEventEnum } from '../entities/webhook.entity';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://example.com/hooks/easycommerce' })
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  targetUrl: string;

  @ApiProperty({ enum: WebhookEventEnum, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(WebhookEventEnum, { each: true })
  events: WebhookEventEnum[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWebhookDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl({ require_tld: false })
  targetUrl?: string;

  @ApiProperty({ enum: WebhookEventEnum, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(WebhookEventEnum, { each: true })
  events?: WebhookEventEnum[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
