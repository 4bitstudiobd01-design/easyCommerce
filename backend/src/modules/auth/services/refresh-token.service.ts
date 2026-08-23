import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FindUserByEmailService } from '../../user/services/find-user-by-email.service';
import { SessionEntity } from '../../user/entities/session.entity';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly findUserByEmailService: FindUserByEmailService,
    private readonly jwtService: JwtService,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
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
   * refresh token. The session row (looked up by the `sid` claim) is checked first so a
   * password reset or logout can revoke a refresh token at the database level — JWT
   * signature/expiry alone can't be invalidated early.
   */
  async execute(refreshToken: string): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: { sub: string; email: string; role: string; sid?: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'bitcommerce_jwt_secret_key_change_in_prod',
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }

    if (!payload.sid) {
      throw new UnauthorizedException('Refresh token is invalid or has expired');
    }

    const session = await this.sessionRepository.findOne({ where: { id: payload.sid } });

    if (!session || !session.isValid || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session has been invalidated or has expired');
    }

    const user = await this.findUserByEmailService.execute(payload.email);

    if (!user || user.id !== payload.sub) {
      throw new UnauthorizedException('Account no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Sliding session: same row, pushed forward — mirrors the normal (non-"remember me")
    // session lifetime. (Pre-existing minor inconsistency: this doesn't preserve an
    // original "remember me" 30-day duration across rotations; out of scope here.)
    const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.sessionRepository.update(session.id, { expiresAt: nextExpiresAt });

    const nextPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: session.id,
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
