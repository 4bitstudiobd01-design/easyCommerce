import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerAddressDto {
  @ApiProperty({ description: 'Label for address (e.g. Home, Office, Other)', default: 'Home' })
  @IsOptional()
  @IsString()
  label?: string = 'Home';

  @ApiProperty({ description: 'Recipient Name' })
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @ApiProperty({ description: 'Contact Phone Number' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Primary Address Line' })
  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @ApiPropertyOptional({ description: 'Secondary Address Line / Landmark' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ description: 'Area / Neighborhood' })
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional({ description: 'Thana / Upazila' })
  @IsOptional()
  @IsString()
  thana?: string;

  @ApiPropertyOptional({ description: 'District' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Division' })
  @IsOptional()
  @IsString()
  division?: string;

  @ApiPropertyOptional({ description: 'City name', default: 'Dhaka' })
  @IsOptional()
  @IsString()
  city?: string = 'Dhaka';

  @ApiPropertyOptional({ description: 'Postal Code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country', default: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string = 'Bangladesh';

  @ApiPropertyOptional({ description: 'Set as default address', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}
