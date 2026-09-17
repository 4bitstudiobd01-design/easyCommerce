import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsArray, IsOptional, IsUUID } from 'class-validator';
import { StaffPermissionType } from '../entities/staff.entity';

export class InviteStaffDto {
  @ApiProperty({ example: 'Staff Member Name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'staff@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '01711002233', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'INVENTORY_MANAGER' })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({ example: ['products:read', 'inventory:read', 'inventory:transfer'] })
  @IsArray()
  permissions: StaffPermissionType[];

  @ApiProperty({
    example: '3f6e6b1a-2b8a-4c5a-8f3a-1e2d3c4b5a6f',
    required: false,
    description: 'Restrict this staff member to a single branch. Omit for store-wide access across all branches.',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
