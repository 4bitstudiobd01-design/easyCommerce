import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsLogEntity } from '../entities/sms-log.entity';

@Injectable()
export class ListSmsLogsService {
  constructor(
    @InjectRepository(SmsLogEntity)
    private readonly smsLogRepository: Repository<SmsLogEntity>,
  ) {}

  async execute(tenantId: string): Promise<SmsLogEntity[]> {
    return this.smsLogRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }
}
