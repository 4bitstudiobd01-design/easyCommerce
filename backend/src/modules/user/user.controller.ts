import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { UserEntity } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly findUserByIdService: FindUserByIdService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  async getProfile(@Param('id') id: string): Promise<UserEntity> {
    return this.findUserByIdService.execute(id);
  }
}
