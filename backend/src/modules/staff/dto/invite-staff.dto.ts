import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsArray, IsOptional } from 'class-validator';
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
}
