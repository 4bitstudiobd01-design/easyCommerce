import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { UpdateChartOfAccountDto } from '../dto/chart-of-accounts.dto';

@Injectable()
export class UpdateChartOfAccountService {
  constructor(
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
  ) {}

  async execute(
    storeId: string,
    id: string,
    dto: UpdateChartOfAccountDto,
  ): Promise<FinanceChartOfAccountEntity> {
    const account = await this.coaRepository.findOne({
      where: { id, storeId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID "${id}" not found.`);
    }

    if (dto.name !== undefined) account.name = dto.name.trim();
    if (dto.subType !== undefined) account.subType = dto.subType;
    if (dto.description !== undefined) account.description = dto.description;
    if (dto.isActive !== undefined) {
      if (account.isSystem && !dto.isActive) {
        throw new BadRequestException('Cannot deactivate a core system account.');
      }
      account.isActive = dto.isActive;
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === account.id) {
        throw new BadRequestException('An account cannot be its own parent.');
      }
      account.parentId = dto.parentId || undefined;
    }

    return this.coaRepository.save(account);
  }
}
