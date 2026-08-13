import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum, MaxLength } from 'class-validator';
import { CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'Customer first name', example: 'Rahim' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Customer last name', example: 'Hossain' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Customer email address', example: 'rahim@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Customer mobile phone number', example: '01711000111' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ enum: CustomerStatusEnum })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum;

  @ApiPropertyOptional({ enum: CustomerSourceEnum })
  @IsOptional()
  @IsEnum(CustomerSourceEnum)
  source?: CustomerSourceEnum;
}
