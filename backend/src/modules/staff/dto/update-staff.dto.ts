import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsEnum, IsUUID } from 'class-validator';
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

  @ApiProperty({
    example: '3f6e6b1a-2b8a-4c5a-8f3a-1e2d3c4b5a6f',
    required: false,
    nullable: true,
    description:
      'Restrict this staff member to a single branch. Pass null (or omit the field with no change intended) for store-wide access across all branches.',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string | null;
}
