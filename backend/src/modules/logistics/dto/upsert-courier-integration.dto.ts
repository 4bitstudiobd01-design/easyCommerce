import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/**
 * Credential fields a merchant can submit.
 *
 * The set is fixed here rather than accepting an open object, so a caller
 * cannot smuggle arbitrary keys into the encrypted blob. Which of these a given
 * provider actually needs is declared by its adapter's `credentialFields` and
 * enforced by the upsert service.
 *
 * A field left out is unchanged; a field sent as an empty string is cleared;
 * a field sent back as the mask we returned is treated as unchanged.
 */
export class CourierCredentialsDto {
  @ApiPropertyOptional({ description: 'Steadfast / RedX / Paperfly API key' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Steadfast secret key' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  secretKey?: string;

  @ApiPropertyOptional({ description: 'Pathao client id' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientId?: string;

  @ApiPropertyOptional({ description: 'Pathao client secret' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientSecret?: string;

  @ApiPropertyOptional({ description: "CarryBee's Client-Context auth header" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  clientContext?: string;

  @ApiPropertyOptional({ description: "Pathao's / CarryBee's own merchant store id" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  merchantStoreId?: string;

  @ApiPropertyOptional({ description: 'Merchant portal username, where the provider needs one' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  username?: string;

  @ApiPropertyOptional({ description: 'Merchant portal password, where the provider needs one' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  password?: string;

  @ApiPropertyOptional({ description: 'Override the provider base URL (self-hosted or staging)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  baseUrl?: string;
}

export class UpsertCourierIntegrationDto {
  @ApiPropertyOptional({ type: CourierCredentialsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CourierCredentialsDto)
  credentials?: CourierCredentialsDto;

  @ApiPropertyOptional({ description: 'Connect (true) or disconnect (false) this provider' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Point the adapter at the provider sandbox' })
  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @ApiPropertyOptional({ description: 'Book a parcel automatically when an order is ready to ship' })
  @IsOptional()
  @IsBoolean()
  autoCreateShipment?: boolean;

  @ApiPropertyOptional({ description: 'Let the scheduled sync pull tracking for this provider' })
  @IsOptional()
  @IsBoolean()
  autoUpdateTracking?: boolean;

  @ApiPropertyOptional({ description: 'Make this the provider pre-selected when booking' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ToggleCourierIntegrationDto {
  @ApiPropertyOptional({ description: 'Target state; omit to flip the current one' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
