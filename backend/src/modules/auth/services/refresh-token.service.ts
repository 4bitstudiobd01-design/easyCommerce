import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FindUserByEmailService } from '../../user/services/find-user-by-email.service';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly findUserByEmailService: FindUserByEmailService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Exchanges a valid refresh token for a fresh access token.
   *
   * Access tokens live 15 minutes while the session cookie lives 7 days, so without
   * this endpoint the dashboard kept "looking" logged in while every API call returned
   * 401 — the merchant saw empty screens until they manually logged out and back in.
   *
   * The user is re-read from the database on every refresh so a deactivated or deleted
   * account cannot keep minting access tokens for the remaining lifetime of its
   * refresh token.
   */
  async execute(refreshToken: string): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'bitcommerce_jwt_secret_key_change_in_prod',
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }

    const user = await this.findUserByEmailService.execute(payload.email);

    if (!user || user.id !== payload.sub) {
      throw new UnauthorizedException('Account no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    const nextPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(nextPayload, { expiresIn: '15m' }),
      // Rotated so an active session keeps sliding forward instead of hard-expiring
      // after 7 days of continuous use.
      refreshToken: this.jwtService.sign(nextPayload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
