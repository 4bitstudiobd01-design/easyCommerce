import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { FindUserByIdentifierService } from '../../user/services/find-user-by-identifier.service';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

/** Refresh token lifetime for a normal session vs. an explicit "Remember me". */
const SESSION_REFRESH_EXPIRY = '7d';
const REMEMBERED_REFRESH_EXPIRY = '30d';

@Injectable()
export class LoginService {
  constructor(
    private readonly findUserByIdentifierService: FindUserByIdentifierService,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.findUserByIdentifierService.execute(dto.identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials. Please try again.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: dto.rememberMe ? REMEMBERED_REFRESH_EXPIRY : SESSION_REFRESH_EXPIRY,
    });

    let storePayload = undefined;
    try {
      const store = await this.findStoreByUserService.execute(user.id);
      if (store) {
        storePayload = {
          id: store.id,
          name: store.name,
          slug: store.slug,
          tenantId: store.tenantId,
        };
      }
    } catch {
      // Non-blocking fallback
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      store: storePayload,
    };
  }
}
