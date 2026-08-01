import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStoreDto {
  @ApiProperty({ example: 'My Online Fashion Store', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '01700000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Dhanmondi, Dhaka', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'www.sumonfashion.com', required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ example: 'BDT', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'sf_api_key_123', required: false })
  @IsOptional()
  @IsString()
  steadfastApiKey?: string;

  @ApiProperty({ example: 'sf_secret_key_456', required: false })
  @IsOptional()
  @IsString()
  steadfastSecretKey?: string;

  @ApiProperty({ example: 'pth_client_id_789', required: false })
  @IsOptional()
  @IsString()
  pathaoClientId?: string;

  @ApiProperty({ example: 'pth_client_secret_012', required: false })
  @IsOptional()
  @IsString()
  pathaoClientSecret?: string;
}
