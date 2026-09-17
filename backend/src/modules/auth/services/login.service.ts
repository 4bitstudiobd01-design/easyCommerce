import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { FindUserByIdentifierService } from '../../user/services/find-user-by-identifier.service';
import { SessionEntity } from '../../user/entities/session.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { FindStoreByUserService } from '../../tenant/services/find-store-by-user.service';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

/** Refresh token lifetime for a normal session vs. an explicit "Remember me". */
const SESSION_REFRESH_EXPIRY = '7d';
const REMEMBERED_REFRESH_EXPIRY = '30d';

/** Consecutive failed attempts before the account is temporarily locked out. */
const MAX_FAILED_ATTEMPTS = 5;
/** Lockout duration for the first lockout; doubles on each subsequent lockout (exponential backoff). */
const BASE_LOCKOUT_MINUTES = 1;
/** Upper bound on the exponential backoff so an account is never locked indefinitely. */
const MAX_LOCKOUT_MINUTES = 30;
const GENERIC_INVALID_CREDENTIALS = 'Invalid credentials. Please try again.';

function addExpiry(base: Date, expiry: typeof SESSION_REFRESH_EXPIRY | typeof REMEMBERED_REFRESH_EXPIRY): Date {
  const days = expiry === REMEMBERED_REFRESH_EXPIRY ? 30 : 7;
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Exponential backoff keyed off how many lockouts have already occurred at
 * MAX_FAILED_ATTEMPTS granularity: 5 fails → 1m, 10 → 2m, 15 → 4m, ... capped at
 * MAX_LOCKOUT_MINUTES. Matches OWASP's guidance of escalating delays over a hard
 * permanent lock, so a legitimate user is never permanently locked out.
 */
function computeLockoutMinutes(failedAttempts: number): number {
  const lockoutNumber = Math.floor(failedAttempts / MAX_FAILED_ATTEMPTS);
  const minutes = BASE_LOCKOUT_MINUTES * 2 ** (lockoutNumber - 1);
  return Math.min(minutes, MAX_LOCKOUT_MINUTES);
}

@Injectable()
export class LoginService {
  constructor(
    private readonly findUserByIdentifierService: FindUserByIdentifierService,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly jwtService: JwtService,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.findUserByIdentifierService.execute(dto.identifier);

    if (!user) {
      throw new UnauthorizedException(GENERIC_INVALID_CREDENTIALS);
    }

    if (user.loginLockedUntil && user.loginLockedUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((user.loginLockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Too many failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts % MAX_FAILED_ATTEMPTS === 0;

      await this.userRepository.update(user.id, {
        failedLoginAttempts: failedAttempts,
        ...(shouldLock
          ? { loginLockedUntil: new Date(Date.now() + computeLockoutMinutes(failedAttempts) * 60 * 1000) }
          : {}),
      });

      throw new UnauthorizedException(GENERIC_INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    if (user.failedLoginAttempts > 0 || user.loginLockedUntil) {
      await this.userRepository.update(user.id, {
        failedLoginAttempts: 0,
        loginLockedUntil: null,
      });
    }

    const refreshExpiry = dto.rememberMe ? REMEMBERED_REFRESH_EXPIRY : SESSION_REFRESH_EXPIRY;

    const session = await this.sessionRepository.save(
      this.sessionRepository.create({
        userId: user.id,
        isValid: true,
        expiresAt: addExpiry(new Date(), refreshExpiry),
      }),
    );

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: session.id,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshExpiry });

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
