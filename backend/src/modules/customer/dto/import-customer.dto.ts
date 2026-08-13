import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';

export class ImportCustomerRowDto {
  @ApiProperty({ description: 'Customer first name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Customer last name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Customer email address' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: 'Customer phone number' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({ enum: CustomerSourceEnum, default: CustomerSourceEnum.IMPORT })
  @IsOptional()
  @IsEnum(CustomerSourceEnum)
  source?: CustomerSourceEnum;

  @ApiPropertyOptional({ enum: CustomerStatusEnum, default: CustomerStatusEnum.ACTIVE })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum;
}

export class ImportCustomersDto {
  @ApiProperty({ type: [ImportCustomerRowDto], description: 'Array of customer rows to import' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportCustomerRowDto)
  customers: ImportCustomerRowDto[];

  @ApiPropertyOptional({ description: 'Overwrite existing customer records if phone/email matches', default: false })
  @IsOptional()
  overwrite?: boolean;
}
