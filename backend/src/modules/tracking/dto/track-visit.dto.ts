import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class TrackVisitDto {
  @ApiProperty({ description: 'Client-generated storefront visit session id' })
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ example: 'darucinifashon', description: 'Storefront slug' })
  @IsString()
  @IsNotEmpty()
  storeSlug: string;

  @ApiProperty({ required: false, description: "Client-resolved channel bucket; re-validated server-side" })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  referrerHost?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  landingPage?: string;
}
