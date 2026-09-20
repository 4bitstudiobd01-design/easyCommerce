import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  EmployeeGenderEnum,
  EmploymentStatusEnum,
  EmploymentTypeEnum,
  MaritalStatusEnum,
} from '../entities/employee.entity';

export class EducationEntryDto {
  @ApiProperty({ example: 'University of Dhaka' })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({ example: 'B.Sc in Computer Science' })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @ApiPropertyOptional({ example: 2016 })
  @IsOptional()
  @IsInt()
  startYear?: number;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @IsInt()
  endYear?: number;
}

export class ExperienceEntryDto {
  @ApiProperty({ example: 'ACME Ltd.' })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: '2020-02-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2023-06-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Led the backend team.' })
  @IsOptional()
  @IsString()
  description?: string;
}

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

  @ApiPropertyOptional({ example: 'Father' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ example: 'Amena Begum' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  secondaryEmergencyContactName?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  secondaryEmergencyContactPhone?: string;

  @ApiPropertyOptional({ example: 'Mother' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondaryEmergencyContactRelation?: string;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'Employee this person reports to' })
  @IsOptional()
  @IsUUID()
  reportsToEmployeeId?: string;

  @ApiPropertyOptional({ example: '1990123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({ example: 'BN0123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportNumber?: string;

  @ApiPropertyOptional({ example: '2029-05-15' })
  @IsOptional()
  @IsDateString()
  passportExpiryDate?: string;

  @ApiPropertyOptional({ example: 'Bangladeshi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({ example: 'Islam' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  religion?: string;

  @ApiPropertyOptional({ enum: MaritalStatusEnum })
  @IsOptional()
  @IsEnum(MaritalStatusEnum)
  maritalStatus?: MaritalStatusEnum;

  @ApiPropertyOptional({ example: 'Rina Akter' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  spouseName?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  spouseEmployed?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfChildren?: number;

  @ApiPropertyOptional({ example: 'Dutch-Bangla Bank Ltd.' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'Gulshan Branch' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bankBranchName?: string;

  @ApiPropertyOptional({ example: '090261234' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankRoutingNumber?: string;

  @ApiPropertyOptional({ example: 'Award winning designer with 10 years of experience.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: [EducationEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationEntryDto)
  education?: EducationEntryDto[];

  @ApiPropertyOptional({ type: [ExperienceEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experience?: ExperienceEntryDto[];
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

  @ApiPropertyOptional({ example: 'Father' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ example: 'Amena Begum' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  secondaryEmergencyContactName?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  secondaryEmergencyContactPhone?: string;

  @ApiPropertyOptional({ example: 'Mother' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  secondaryEmergencyContactRelation?: string;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'Pass null to clear' })
  @IsOptional()
  @IsUUID()
  reportsToEmployeeId?: string | null;

  @ApiPropertyOptional({ example: '1990123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({ example: 'BN0123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportNumber?: string;

  @ApiPropertyOptional({ example: '2029-05-15' })
  @IsOptional()
  @IsDateString()
  passportExpiryDate?: string;

  @ApiPropertyOptional({ example: 'Bangladeshi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({ example: 'Islam' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  religion?: string;

  @ApiPropertyOptional({ enum: MaritalStatusEnum })
  @IsOptional()
  @IsEnum(MaritalStatusEnum)
  maritalStatus?: MaritalStatusEnum;

  @ApiPropertyOptional({ example: 'Rina Akter' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  spouseName?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  spouseEmployed?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfChildren?: number;

  @ApiPropertyOptional({ example: 'Dutch-Bangla Bank Ltd.' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'Gulshan Branch' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bankBranchName?: string;

  @ApiPropertyOptional({ example: '090261234' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankRoutingNumber?: string;

  @ApiPropertyOptional({ example: 'Award winning designer with 10 years of experience.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ type: [EducationEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationEntryDto)
  education?: EducationEntryDto[];

  @ApiPropertyOptional({ type: [ExperienceEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceEntryDto)
  experience?: ExperienceEntryDto[];
}
