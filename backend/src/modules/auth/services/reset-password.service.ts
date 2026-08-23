import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { FindUserByEmailService } from '../../user/services/find-user-by-email.service';
import { UserEntity } from '../../user/entities/user.entity';
import { SessionEntity } from '../../user/entities/session.entity';
import { ResetPasswordDto } from '../dto/reset-password.dto';

const MAX_ATTEMPTS = 5;
const INVALID_OR_EXPIRED_MESSAGE = 'Invalid or expired reset code.';

@Injectable()
export class ResetPasswordService {
  constructor(
    private readonly findUserByEmailService: FindUserByEmailService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.findUserByEmailService.execute(dto.email);

    // Generic error in every failure branch — never reveal whether the email exists
    // or which specific check failed.
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      throw new BadRequestException(INVALID_OR_EXPIRED_MESSAGE);
    }

    if (user.passwordResetAttempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Too many attempts. Please request a new code.');
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException(INVALID_OR_EXPIRED_MESSAGE);
    }

    const isOtpValid = await bcrypt.compare(dto.otp, user.passwordResetOtpHash);

    if (!isOtpValid) {
      await this.userRepository.update(user.id, {
        passwordResetAttempts: user.passwordResetAttempts + 1,
      });
      throw new BadRequestException(INVALID_OR_EXPIRED_MESSAGE);
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.userRepository.update(user.id, {
      passwordHash,
      passwordResetOtpHash: null,
      passwordResetOtpExpiresAt: null,
      passwordResetAttempts: 0,
      passwordResetLastRequestedAt: null,
    });

    // Revoke existing sessions so a compromised session/refresh token doesn't survive
    // the reset. Already-issued access tokens (15 min TTL) remain valid until natural
    // expiry — JwtAuthGuard doesn't consult the sessions table on every request.
    await this.sessionRepository.update({ userId: user.id }, { isValid: false });

    return { message: 'Your password has been reset successfully. Please log in with your new password.' };
  }
}
