import { Controller, Get, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FindUserByIdService } from './services/find-user-by-id.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRoleEnum } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly findUserByIdService: FindUserByIdService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile by ID (self or Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  async getProfile(
    @Param('id') id: string,
    @CurrentUser('sub') currentUserId: string,
    @CurrentUser('role') currentUserRole: UserRoleEnum,
  ): Promise<UserResponseDto> {
    if (currentUserId !== id && currentUserRole !== UserRoleEnum.SUPER_ADMIN) {
      throw new ForbiddenException('You can only view your own profile.');
    }

    const user = await this.findUserByIdService.execute(id);
    const { passwordHash, sessions, ...safeUser } = user;
    return safeUser as UserResponseDto;
  }
}
