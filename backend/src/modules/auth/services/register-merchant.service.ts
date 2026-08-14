import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { FindUserByEmailService } from '../../user/services/find-user-by-email.service';
import { CreateUserService } from '../../user/services/create-user.service';
import { UserRoleEnum } from '../../user/entities/user.entity';
import { RegisterMerchantDto } from '../dto/register-merchant.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { normalizePhone } from '../../../common/utils/normalize-phone.util';

@Injectable()
export class RegisterMerchantService {
  constructor(
    private readonly findUserByEmailService: FindUserByEmailService,
    private readonly createUserService: CreateUserService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterMerchantDto): Promise<AuthResponseDto> {
    const existingUser = await this.findUserByEmailService.execute(dto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const savedUser = await this.createUserService.execute({
      email: dto.email.toLowerCase(),
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone ? normalizePhone(dto.phone) : undefined,
      role: UserRoleEnum.STORE_OWNER,
      isActive: true,
    });

    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        role: savedUser.role,
      },
    };
  }
}
