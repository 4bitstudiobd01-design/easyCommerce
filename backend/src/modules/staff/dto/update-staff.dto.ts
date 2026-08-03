import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { StaffPermissionType, StaffStatusEnum } from '../entities/staff.entity';

export class UpdateStaffPermissionsDto {
  @ApiProperty({ example: 'STORE_MANAGER', required: false })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ example: ['products:read', 'orders:read'], required: false })
  @IsOptional()
  @IsArray()
  permissions?: StaffPermissionType[];

  @ApiProperty({ enum: StaffStatusEnum, example: StaffStatusEnum.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(StaffStatusEnum)
  status?: StaffStatusEnum;
}
