import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { FindUserByEmailService } from '../../user/services/find-user-by-email.service';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationProducer } from '../../../common/notification/notification.producer';
import { otpEmailTemplate } from '../../../common/notification/templates/otp.template';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';

const OTP_EXPIRY_MINUTES = 10;
const REQUEST_COOLDOWN_SECONDS = 60;
const GENERIC_MESSAGE = 'If an account exists for this email, a reset code has been sent.';

@Injectable()
export class RequestPasswordResetService {
  constructor(
    private readonly findUserByEmailService: FindUserByEmailService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly notificationProducer: NotificationProducer,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.findUserByEmailService.execute(dto.email);

    // Email enumeration protection: always return the same generic message whether or
    // not the account exists, and only do DB writes / send mail when it does.
    if (!user) {
      return { message: GENERIC_MESSAGE };
    }

    if (user.passwordResetLastRequestedAt) {
      const secondsSinceLast = (Date.now() - user.passwordResetLastRequestedAt.getTime()) / 1000;
      if (secondsSinceLast < REQUEST_COOLDOWN_SECONDS) {
        throw new BadRequestException(
          `Please wait ${Math.ceil(REQUEST_COOLDOWN_SECONDS - secondsSinceLast)}s before requesting another code.`,
        );
      }
    }

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const otpHash = await bcrypt.hash(otp, 10);

    await this.userRepository.update(user.id, {
      passwordResetOtpHash: otpHash,
      passwordResetOtpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      passwordResetAttempts: 0,
      passwordResetLastRequestedAt: new Date(),
    });

    await this.notificationProducer.sendNotification(
      user.email,
      'Your BitCommerce password reset code',
      `Your password reset code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      {
        email: true,
        type: 'PASSWORD_RESET',
        htmlBody: otpEmailTemplate({
          recipientName: user.fullName,
          otp,
          expiresInMinutes: OTP_EXPIRY_MINUTES,
          purpose: 'পাসওয়ার্ড রিসেট',
        }),
      },
    );

    return { message: GENERIC_MESSAGE };
  }
}
