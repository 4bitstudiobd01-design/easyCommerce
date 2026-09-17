import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Length, Matches, Min } from 'class-validator';

/**
 * REDX_OpenAPI_Integration_Spec.md §3.8 — POST /pickup/store.
 * Phone format mirrors what other courier DTOs in this module already
 * require (11-digit BD mobile) — RedX's own docs don't state a length limit,
 * so this matches the platform's own convention rather than an unconfirmed one.
 */
export class CreateRedxStoreDto {
  @ApiProperty({ description: 'Name of the pickup store' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Contact phone for the pickup store (11-digit BD mobile)' })
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, { message: 'phone must be an 11-digit Bangladeshi mobile number' })
  phone: string;

  @ApiProperty({ description: 'Physical address of the pickup store' })
  @IsString()
  @Length(1, 255)
  address: string;

  @ApiProperty({ description: "RedX area id where the store is located, from GET /redx/areas" })
  @IsInt()
  @Min(1)
  areaId: number;
}

export class RedxStoreDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  areaName: string;

  @ApiProperty()
  areaId: number;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  createdAt?: string;
}
