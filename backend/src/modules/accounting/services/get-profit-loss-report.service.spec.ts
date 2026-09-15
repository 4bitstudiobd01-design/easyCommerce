import { GetProfitLossReportService } from './get-profit-loss-report.service';
import { AccountTypeEnum, NormalBalanceEnum } from '../entities/account.entity';

describe('GetProfitLossReportService', () => {
  const REVENUE_ACCOUNT = {
    id: 'acc-revenue',
    storeId: 'store-1',
    code: '4010',
    name: 'Sales Revenue',
    type: AccountTypeEnum.REVENUE,
    normalBalance: NormalBalanceEnum.CREDIT,
  };
  const EXPENSE_ACCOUNT = {
    id: 'acc-expense',
    storeId: 'store-1',
    code: '5050',
    name: 'Office Rent',
    type: AccountTypeEnum.EXPENSE,
    normalBalance: NormalBalanceEnum.DEBIT,
  };

  /**
   * Builds a service whose journalLineRepository.createQueryBuilder returns rows that
   * differ depending on whether a branchId filter was applied, so tests can assert the
   * filter clause was (or was not) added — without a real database.
   */
  const build = () => {
    const accountRepository = {
      find: jest.fn().mockResolvedValue([REVENUE_ACCOUNT, EXPENSE_ACCOUNT]),
    };

    let capturedBranchId: string | undefined;

    const allRows = [
      { accountId: 'acc-revenue', debit: '0', credit: '1000' },
      { accountId: 'acc-expense', debit: '400', credit: '0' },
    ];
    const branchOnlyRows = [
      { accountId: 'acc-revenue', debit: '0', credit: '300' },
      { accountId: 'acc-expense', debit: '100', credit: '0' },
    ];

    const qb: any = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockImplementation((clause: string, params: any) => {
        if (clause.includes('branchId')) {
          capturedBranchId = params.branchId;
        }
        return qb;
      }),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockImplementation(() =>
        Promise.resolve(capturedBranchId ? branchOnlyRows : allRows),
      ),
    };

    const journalLineRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const getAccountingSettingsService = {
      execute: jest.fn().mockResolvedValue({ fiscalYearStartMonth: 7 }),
    };

    const service = new GetProfitLossReportService(
      accountRepository as any,
      journalLineRepository as any,
      getAccountingSettingsService as any,
    );

    return { service, journalLineRepository };
  };

  it('omitting branchId returns the full store aggregate exactly as before', async () => {
    const { service } = build();

    const report = await service.execute('tenant-1', 'store-1', {
      from: '2026-01-01',
      to: '2026-12-31',
    });

    expect(report.branchId).toBeUndefined();
    expect(report.revenue.total).toBe('1000.00');
    expect(report.operatingExpenses.total).toBe('400.00');
    expect(report.netProfit).toBe('600.00');
  });

  it('filtering by branchId returns only matching lines', async () => {
    const { service, journalLineRepository } = build();

    const report = await service.execute('tenant-1', 'store-1', {
      from: '2026-01-01',
      to: '2026-12-31',
      branchId: 'branch-1',
    });

    const qb = journalLineRepository.createQueryBuilder.mock.results[0].value;
    expect(qb.andWhere).toHaveBeenCalledWith('line.branchId = :branchId', {
      branchId: 'branch-1',
    });

    expect(report.branchId).toBe('branch-1');
    expect(report.revenue.total).toBe('300.00');
    expect(report.operatingExpenses.total).toBe('100.00');
    expect(report.netProfit).toBe('200.00');
  });
});
