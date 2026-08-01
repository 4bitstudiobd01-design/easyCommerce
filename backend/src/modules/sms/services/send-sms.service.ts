import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SmsLogEntity, SmsStatusEnum } from '../entities/sms-log.entity';

export interface SendSmsPayload {
  recipientPhone: string;
  message: string;
  tenantId: string;
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

    const smsLog = this.smsLogRepository.create({
      recipientPhone: payload.recipientPhone,
      message: payload.message,
      gateway: 'BULKSMSBD',
      status: isSandbox ? SmsStatusEnum.SANDBOX : SmsStatusEnum.SENT,
      tenantId: payload.tenantId,
    });

    return this.smsLogRepository.save(smsLog);
  }
}
