import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRoleEnum } from '../../user/entities/user.entity';
import { SessionEntity } from '../../user/entities/session.entity';
import { AuthResponseDto } from '../dto/auth-response.dto';

const DEV_SESSION_EXPIRY_DAYS = 7;

@Injectable()
export class DevLoginAsMerchantService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Issues a real session + token pair for a chosen merchant, without their password,
   * so a developer/QA can review merchant-facing work (e.g. HRMS) from the merchant's
   * own dashboard. Mirrors LoginService's token/session shape exactly so refresh works
   * normally. Hard-disabled in production and restricted to STORE_OWNER accounts only —
   * this must never become a way to reach a SUPER_ADMIN or another merchant's staff.
   */
  async execute(userId: string): Promise<AuthResponseDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev merchant switcher is disabled in production environments.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Merchant not found.');
    }

    if (user.role !== UserRoleEnum.STORE_OWNER) {
      throw new ForbiddenException('The dev switcher can only log in as merchant (STORE_OWNER) accounts.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('This merchant account is deactivated.');
    }

    const session = await this.sessionRepository.save(
      this.sessionRepository.create({
        userId: user.id,
        isValid: true,
        expiresAt: new Date(Date.now() + DEV_SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      }),
    );

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: session.id,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: `${DEV_SESSION_EXPIRY_DAYS}d` }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
