import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EmploymentTypeEnum } from '../entities/employee.entity';
import { JobPostingStatusEnum } from '../entities/job-posting.entity';
import { CandidateStageEnum } from '../entities/candidate.entity';
import { InterviewStatusEnum } from '../entities/interview.entity';

export class CreateJobPostingDto {
  @ApiProperty({ example: 'Senior Frontend Engineer' })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ enum: EmploymentTypeEnum })
  @IsOptional()
  @IsEnum(EmploymentTypeEnum)
  employmentType?: EmploymentTypeEnum;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  openings?: number;

  @ApiPropertyOptional({ example: 'We are looking for...' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateJobPostingDto {
  @ApiPropertyOptional({ example: 'Senior Frontend Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({ enum: EmploymentTypeEnum })
  @IsOptional()
  @IsEnum(EmploymentTypeEnum)
  employmentType?: EmploymentTypeEnum;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  openings?: number;

  @ApiPropertyOptional({ enum: JobPostingStatusEnum })
  @IsOptional()
  @IsEnum(JobPostingStatusEnum)
  status?: JobPostingStatusEnum;

  @ApiPropertyOptional({ example: 'We are looking for...' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCandidateDto {
  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsUUID()
  jobPostingId: string;

  @ApiProperty({ example: 'Farhana Akter' })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MaxLength(150)
  fullName: string;

  @ApiPropertyOptional({ example: 'farhana@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+8801812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'LinkedIn' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiPropertyOptional({ example: 'Strong portfolio, referred by a current employee.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCandidateStageDto {
  @ApiProperty({ enum: CandidateStageEnum })
  @IsEnum(CandidateStageEnum)
  stage: CandidateStageEnum;

  @ApiPropertyOptional({ example: 'Great culture fit, moving to offer stage.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleInterviewDto {
  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsUUID()
  candidateId: string;

  @ApiProperty({ example: '2026-10-01T10:00:00.000Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Rahim Uddin, Nusrat Jahan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  interviewerNames?: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsOptional()
  @IsString()
  meetingLink?: string;
}

export class UpdateInterviewDto {
  @ApiPropertyOptional({ example: '2026-10-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Rahim Uddin, Nusrat Jahan' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  interviewerNames?: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiPropertyOptional({ enum: InterviewStatusEnum })
  @IsOptional()
  @IsEnum(InterviewStatusEnum)
  status?: InterviewStatusEnum;

  @ApiPropertyOptional({ example: 'Strong technical round, recommend moving forward.' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class ListJobPostingsQueryDto {
  @ApiPropertyOptional({ enum: JobPostingStatusEnum })
  @IsOptional()
  @IsEnum(JobPostingStatusEnum)
  status?: JobPostingStatusEnum;
}

export class ListCandidatesQueryDto {
  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsOptional()
  @IsUUID()
  jobPostingId?: string;

  @ApiPropertyOptional({ enum: CandidateStageEnum })
  @IsOptional()
  @IsEnum(CandidateStageEnum)
  stage?: CandidateStageEnum;
}

export class ListInterviewsQueryDto {
  @ApiPropertyOptional({ description: 'When true, only return SCHEDULED interviews from now onward, soonest first' })
  @IsOptional()
  @Type(() => Boolean)
  upcoming?: boolean;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
