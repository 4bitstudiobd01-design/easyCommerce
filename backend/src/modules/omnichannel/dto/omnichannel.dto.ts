import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OmnichannelPlatformType } from '../entities/omnichannel-credential.entity';

export class UpsertCredentialDto {
  @ApiProperty({
    description: 'Platform type',
    example: 'telegram',
    enum: [
      'telegram',
      'whatsapp',
      'facebook',
      'instagram',
      'linkedin',
      'x',
      'shopify',
      'slack',
      'hubspot',
      'custom',
    ],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'telegram',
    'whatsapp',
    'facebook',
    'instagram',
    'linkedin',
    'x',
    'shopify',
    'slack',
    'hubspot',
    'custom',
  ])
  platform: OmnichannelPlatformType;

  @ApiPropertyOptional({ description: 'Display name for this credential' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Credentials key-value payload',
    example: { botToken: '123456:ABC-DEF...' },
  })
  @IsObject()
  credentials: Record<string, any>;

  @ApiPropertyOptional({ description: 'Account handle or display username' })
  @IsString()
  @IsOptional()
  accountHandle?: string;

  @ApiPropertyOptional({ description: 'Optional extra metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class TestCredentialDto {
  @ApiPropertyOptional({
    description: 'Direct credentials payload to test without saving first',
  })
  @IsObject()
  @IsOptional()
  credentials?: Record<string, any>;
}

export class ToggleActiveDto {
  @ApiProperty({ description: 'Active state toggle', example: true })
  @IsBoolean()
  isActive: boolean;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Target platform for outbound delivery',
    example: 'telegram',
    enum: ['telegram', 'whatsapp', 'facebook', 'instagram', 'x', 'slack'],
  })
  @IsString()
  @IsNotEmpty()
  platform: OmnichannelPlatformType;

  @ApiProperty({
    description: 'Target recipient ID (Chat ID, Phone Number, or PSID)',
    example: '8801711223344',
  })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ description: 'Message body text', example: 'Hello from BitCommerce!' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'Conversation ID' })
  @IsString()
  @IsOptional()
  conversationId?: string;
}

export class SetWebhookDto {
  @ApiProperty({ description: 'Publicly reachable HTTPS webhook callback URL' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Optional secret token for request verification' })
  @IsString()
  @IsOptional()
  secretToken?: string;
}
