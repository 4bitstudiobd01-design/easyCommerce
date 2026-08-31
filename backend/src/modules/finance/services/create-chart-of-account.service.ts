import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { CreateChartOfAccountDto } from '../dto/chart-of-accounts.dto';

@Injectable()
export class CreateChartOfAccountService {
  constructor(
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateChartOfAccountDto,
  ): Promise<FinanceChartOfAccountEntity> {
    const existing = await this.coaRepository.findOne({
      where: { storeId, code: dto.code.trim() },
    });

    if (existing) {
      throw new ConflictException(`Account code "${dto.code}" already exists in this store.`);
    }

    if (dto.parentId) {
      const parent = await this.coaRepository.findOne({
        where: { id: dto.parentId, storeId },
      });
      if (!parent) {
        throw new BadRequestException('Parent account not found.');
      }
    }

    const account = this.coaRepository.create({
      tenantId,
      storeId,
      code: dto.code.trim(),
      name: dto.name.trim(),
      accountClass: dto.accountClass,
      subType: dto.subType || 'GENERAL',
      normalBalance: dto.normalBalance,
      parentId: dto.parentId,
      description: dto.description,
      currentBalance: String(dto.startingBalance || 0),
      currency: dto.currency || 'BDT',
      isSystem: false,
      isActive: true,
    });

    return this.coaRepository.save(account);
  }
}
