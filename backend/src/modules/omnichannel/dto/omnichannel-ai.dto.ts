import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiProviderType, AiTriggerMode } from '../entities/omnichannel-ai-config.entity';

export class SaveAiConfigDto {
  @ApiPropertyOptional({ description: 'Enable/Disable AI Auto-Reply', example: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'AI Provider',
    example: 'gemini',
    enum: ['gemini', 'openai'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['gemini', 'openai'])
  provider?: AiProviderType;

  @ApiPropertyOptional({
    description: 'Model identifier',
    example: 'gemini-1.5-flash',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'Plaintext API Key to encrypt and save (or masked value to keep existing)',
    example: 'AIzaSy...',
  })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({
    description: 'System instruction / store persona prompt',
  })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiPropertyOptional({
    description: 'Trigger condition mode',
    example: 'NO_HUMAN_ACTIVE',
    enum: ['NO_HUMAN_ACTIVE', 'ALWAYS', 'OUTSIDE_HOURS'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['NO_HUMAN_ACTIVE', 'ALWAYS', 'OUTSIDE_HOURS'])
  triggerMode?: AiTriggerMode;

  @ApiPropertyOptional({ description: 'Sampling temperature (0.0 - 1.0)', example: 0.7 })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({ description: 'Max tokens per reply', example: 500 })
  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @ApiPropertyOptional({ description: 'Custom business facts / context JSON' })
  @IsObject()
  @IsOptional()
  businessContext?: Record<string, any>;
}

export class TestAiConnectionDto {
  @ApiPropertyOptional({
    description: 'AI Provider',
    example: 'gemini',
    enum: ['gemini', 'openai'],
  })
  @IsString()
  @IsOptional()
  @IsIn(['gemini', 'openai'])
  provider?: AiProviderType;

  @ApiPropertyOptional({
    description: 'Model identifier',
    example: 'gemini-1.5-flash',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'API Key to test directly without saving first',
    example: 'AIzaSy...',
  })
  @IsString()
  @IsOptional()
  apiKey?: string;
}

export class ToggleConversationAiDto {
  @ApiProperty({ description: 'Whether AI is paused for this conversation', example: true })
  @IsBoolean()
  isPaused: boolean;
}
