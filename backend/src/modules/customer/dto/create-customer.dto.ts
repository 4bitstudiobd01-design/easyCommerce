import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer first name', example: 'Rahim' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Customer last name', example: 'Hossain' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Customer email address', example: 'rahim@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ description: 'Customer mobile phone number', example: '01711000111' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({ enum: CustomerStatusEnum, default: CustomerStatusEnum.ACTIVE })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum;

  @ApiPropertyOptional({ enum: CustomerSourceEnum, default: CustomerSourceEnum.ONLINE_STORE })
  @IsOptional()
  @IsEnum(CustomerSourceEnum)
  source?: CustomerSourceEnum;

  @ApiPropertyOptional({ description: 'Customer marketing origin (e.g. facebook, tiktok, google, direct, etc.)', example: 'facebook' })
  @IsOptional()
  @IsString()
  origin?: string;
}
