import { ApiProperty } from '@nestjs/swagger';
import { UserRoleEnum } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'merchant@example.com' })
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  fullName: string;

  @ApiProperty({ example: '+8801700000000', required: false })
  phone?: string;

  @ApiProperty({ enum: UserRoleEnum, example: UserRoleEnum.STORE_OWNER })
  role: UserRoleEnum;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', required: false })
  tenantId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
