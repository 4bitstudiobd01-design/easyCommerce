import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancePeriodLockEntity } from '../entities/finance-period-lock.entity';
import { CreatePeriodLockDto } from '../dto/financial-reports.dto';

@Injectable()
export class PeriodLockService {
  constructor(
    @InjectRepository(FinancePeriodLockEntity)
    private readonly periodLockRepository: Repository<FinancePeriodLockEntity>,
  ) {}

  async list(storeId: string): Promise<FinancePeriodLockEntity[]> {
    return this.periodLockRepository.find({
      where: { storeId },
      order: { endDate: 'DESC' },
    });
  }

  async lockPeriod(
    tenantId: string,
    storeId: string,
    userId: string,
    userName: string,
    dto: CreatePeriodLockDto,
  ): Promise<FinancePeriodLockEntity> {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const existing = await this.periodLockRepository.findOne({
      where: { storeId, periodName: dto.periodName.trim() },
    });

    if (existing) {
      throw new ConflictException(`Accounting period "${dto.periodName}" is already registered.`);
    }

    const lock = this.periodLockRepository.create({
      tenantId,
      storeId,
      periodName: dto.periodName.trim(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      isLocked: true,
      lockedAt: new Date(),
      lockedByUserId: userId,
      lockedByName: userName,
      notes: dto.notes,
    });

    return this.periodLockRepository.save(lock);
  }

  async unlockPeriod(storeId: string, id: string): Promise<FinancePeriodLockEntity> {
    const lock = await this.periodLockRepository.findOne({
      where: { id, storeId },
    });

    if (!lock) {
      throw new NotFoundException('Period lock not found.');
    }

    lock.isLocked = false;
    return this.periodLockRepository.save(lock);
  }

  async isDateLocked(storeId: string, targetDate: string): Promise<boolean> {
    const activeLock = await this.periodLockRepository
      .createQueryBuilder('lock')
      .where('lock.storeId = :storeId', { storeId })
      .andWhere('lock.isLocked = true')
      .andWhere('lock.startDate <= :targetDate', { targetDate })
      .andWhere('lock.endDate >= :targetDate', { targetDate })
      .getOne();

    return !!activeLock;
  }
}
