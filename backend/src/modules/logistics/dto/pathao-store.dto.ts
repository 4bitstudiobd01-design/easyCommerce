import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

/**
 * Fields for Pathao's `POST /stores` (PATHAO_INTEGRATION_SPEC §5.1). Length and
 * phone constraints mirror Pathao's own validation so a bad request fails
 * locally with a clear message instead of round-tripping to Pathao for a 422.
 */
export class CreatePathaoStoreDto {
  @ApiProperty({ description: 'Store name shown in the Pathao panel', minLength: 3, maxLength: 50 })
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiProperty({ description: 'Contact person for pickup-related issues', minLength: 3, maxLength: 50 })
  @IsString()
  @Length(3, 50)
  contactName: string;

  @ApiProperty({ description: 'Contact person phone (11 digits, e.g. 017XXXXXXXX)' })
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, { message: 'contactNumber must be an 11-digit Bangladeshi mobile number' })
  contactNumber: string;

  @ApiPropertyOptional({ description: 'Secondary contact phone (11 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, { message: 'secondaryContact must be an 11-digit Bangladeshi mobile number' })
  secondaryContact?: string;

  @ApiPropertyOptional({ description: 'Number the pickup OTP is sent to (11 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, { message: 'otpNumber must be an 11-digit Bangladeshi mobile number' })
  otpNumber?: string;

  @ApiProperty({ description: 'Full pickup address', minLength: 15, maxLength: 120 })
  @IsString()
  @Length(15, 120)
  address: string;

  @ApiProperty({ description: 'Pathao city id — from GET /pathao/cities' })
  @IsInt()
  @Min(1)
  cityId: number;

  @ApiProperty({ description: 'Pathao zone id — from GET /pathao/cities/:cityId/zones' })
  @IsInt()
  @Min(1)
  zoneId: number;

  @ApiProperty({ description: 'Pathao area id — from GET /pathao/zones/:zoneId/areas' })
  @IsInt()
  @Min(1)
  areaId: number;
}

export class PathaoStoreDto {
  @ApiProperty()
  storeId: number;

  @ApiProperty()
  storeName: string;

  @ApiProperty()
  storeAddress: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  cityId: number;

  @ApiProperty()
  zoneId: number;

  @ApiPropertyOptional()
  hubId?: number;

  @ApiProperty()
  isDefaultStore: boolean;

  @ApiProperty()
  isDefaultReturnStore: boolean;
}

export class CreatePathaoStoreResponseDto {
  @ApiProperty({ example: 'Store created successfully, Please wait one hour for approval.' })
  message: string;

  @ApiProperty()
  storeName: string;
}

