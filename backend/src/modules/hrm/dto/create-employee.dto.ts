import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EmployeeGenderEnum, EmploymentStatusEnum, EmploymentTypeEnum } from '../entities/employee.entity';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Rahim Uddin' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(150)
  fullName: string;

  @ApiPropertyOptional({ example: 'rahim@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+8801812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'Warehouse Associate' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  designation?: string;

  @ApiPropertyOptional({ enum: EmploymentTypeEnum, default: EmploymentTypeEnum.FULL_TIME })
  @IsOptional()
  @IsEnum(EmploymentTypeEnum)
  employmentType?: EmploymentTypeEnum;

  @ApiProperty({ example: '2026-01-15', description: 'Date the employee joined (YYYY-MM-DD)' })
  @IsDateString()
  dateOfJoining: string;

  @ApiPropertyOptional({ example: '1998-04-02' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: EmployeeGenderEnum })
  @IsOptional()
  @IsEnum(EmployeeGenderEnum)
  gender?: EmployeeGenderEnum;

  @ApiPropertyOptional({ example: 'House 12, Road 4, Dhanmondi, Dhaka' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Karim Uddin' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+8801912345678' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Rahim Uddin' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: 'rahim@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+8801812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'Pass null to unassign' })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({ example: 'Warehouse Associate' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  designation?: string;

  @ApiPropertyOptional({ enum: EmploymentTypeEnum })
  @IsOptional()
  @IsEnum(EmploymentTypeEnum)
  employmentType?: EmploymentTypeEnum;

  @ApiPropertyOptional({ enum: EmploymentStatusEnum })
  @IsOptional()
  @IsEnum(EmploymentStatusEnum)
  employmentStatus?: EmploymentStatusEnum;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfJoining?: string;

  @ApiPropertyOptional({ example: '1998-04-02' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: EmployeeGenderEnum })
  @IsOptional()
  @IsEnum(EmployeeGenderEnum)
  gender?: EmployeeGenderEnum;

  @ApiPropertyOptional({ example: 'House 12, Road 4, Dhanmondi, Dhaka' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Karim Uddin' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+8801912345678' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}
