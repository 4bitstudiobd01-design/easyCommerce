import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SmsLogEntity, SmsStatusEnum } from '../entities/sms-log.entity';

export interface SendSmsPayload {
  recipientPhone: string;
  message: string;
  tenantId: string;
  gateway?: string;
  wasSent?: boolean;
}

@Injectable()
export class SendSmsService {
  private readonly logger = new Logger(SendSmsService.name);

  constructor(
    @InjectRepository(SmsLogEntity)
    private readonly smsLogRepository: Repository<SmsLogEntity>,
    private readonly configService: ConfigService,
  ) {}

  async execute(payload: SendSmsPayload): Promise<SmsLogEntity> {
    const isSandbox = this.configService.get<string>('SMS_IS_SANDBOX', 'true') === 'true';

    this.logger.log(
      `[SMS DISPATCH ${isSandbox ? 'SANDBOX' : 'LIVE'}] Phone: ${payload.recipientPhone} | Message: "${payload.message}"`,
    );

    // Reflect the actual driver result — never log SENT unless the gateway
    // call genuinely succeeded.
    const status = isSandbox
      ? SmsStatusEnum.SANDBOX
      : payload.wasSent
        ? SmsStatusEnum.SENT
        : SmsStatusEnum.FAILED;

    const smsLog = this.smsLogRepository.create({
      recipientPhone: payload.recipientPhone,
      message: payload.message,
      gateway: payload.gateway || 'BULKSMSBD',
      status,
      tenantId: payload.tenantId,
    });

    return this.smsLogRepository.save(smsLog);
  }
}
