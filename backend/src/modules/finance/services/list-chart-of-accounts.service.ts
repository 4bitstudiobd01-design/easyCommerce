import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { QueryChartOfAccountsDto } from '../dto/chart-of-accounts.dto';
import { SeedDefaultChartOfAccountsService } from './seed-default-chart-of-accounts.service';

@Injectable()
export class ListChartOfAccountsService {
  constructor(
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
    private readonly seederService: SeedDefaultChartOfAccountsService,
  ) {}

  async execute(tenantId: string, storeId: string, query: QueryChartOfAccountsDto) {
    // Ensure default chart of accounts is seeded
    await this.seederService.execute(tenantId, storeId);

    const qb = this.coaRepository
      .createQueryBuilder('coa')
      .leftJoinAndSelect('coa.parent', 'parent')
      .where('coa.storeId = :storeId', { storeId });

    if (query.accountClass) {
      qb.andWhere('coa.accountClass = :accountClass', { accountClass: query.accountClass });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('coa.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(coa.name) LIKE LOWER(:search) OR coa.code LIKE :searchRaw OR LOWER(coa.description) LIKE LOWER(:search))',
        { search: `%${query.search}%`, searchRaw: `%${query.search}%` },
      );
    }

    qb.orderBy('coa.code', 'ASC');

    const accounts = await qb.getMany();

    // Grouping summary by classification
    const summary = {
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      totalRevenue: 0,
      totalExpenses: 0,
      accountCount: accounts.length,
    };

    for (const acc of accounts) {
      const bal = Number(acc.currentBalance || 0);
      switch (acc.accountClass) {
        case 'ASSET':
          summary.totalAssets += bal;
          break;
        case 'LIABILITY':
          summary.totalLiabilities += bal;
          break;
        case 'EQUITY':
          summary.totalEquity += bal;
          break;
        case 'REVENUE':
          summary.totalRevenue += bal;
          break;
        case 'EXPENSE':
          summary.totalExpenses += bal;
          break;
      }
    }

    return {
      accounts,
      summary,
    };
  }
}
