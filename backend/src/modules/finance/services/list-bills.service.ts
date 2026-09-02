import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { ListBillsQueryDto } from '../dto/finance-query.dto';
import { FinanceBillStatusEnum } from '../enums/finance.enums';

@Injectable()
export class ListBillsService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
  ) {}

  async execute(storeId: string, query: ListBillsQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;
    const today = new Date().toISOString().split('T')[0];

    const qb = this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.items', 'items')
      .where('bill.storeId = :storeId', { storeId });

    const isOutstandingFilter = query.status === 'OUTSTANDING';

    // 1. Status filter handling
    if (isOutstandingFilter) {
      // OUTSTANDING: Any bill with balanceDue > 0 across ALL historical months (ignores date range)
      qb.andWhere('CAST(bill.balanceDue AS decimal) > 0')
        .andWhere('bill.status NOT IN (:...nonOutstanding)', {
          nonOutstanding: [FinanceBillStatusEnum.PAID, FinanceBillStatusEnum.VOID],
        });
    } else if (query.status === 'OVERDUE') {
      qb.andWhere(
        '(bill.status = :overdueStatus OR (bill.status IN (:...unpaidStatuses) AND bill.dueDate < :today AND CAST(bill.balanceDue AS decimal) > 0))',
        {
          overdueStatus: FinanceBillStatusEnum.OVERDUE,
          unpaidStatuses: [FinanceBillStatusEnum.UNPAID, FinanceBillStatusEnum.PARTIALLY_PAID],
          today,
        },
      );
    } else if (query.status === 'UNPAID') {
      qb.andWhere('bill.status = :unpaidStatus', { unpaidStatus: FinanceBillStatusEnum.UNPAID });
    } else if (query.status === 'PARTIALLY_PAID') {
      qb.andWhere('bill.status = :partialStatus', { partialStatus: FinanceBillStatusEnum.PARTIALLY_PAID });
    } else if (query.status === 'PAID') {
      qb.andWhere('bill.status = :paidStatus', { paidStatus: FinanceBillStatusEnum.PAID });
    } else if (query.status && query.status !== 'ALL') {
      qb.andWhere('bill.status = :status', { status: query.status });
    }

    // 2. Date filters (Applied unless user specifically asked for ALL-TIME OUTSTANDING)
    if (!isOutstandingFilter) {
      if (query.startDate) {
        qb.andWhere('bill.issueDate >= :startDate', { startDate: query.startDate });
      }
      if (query.endDate) {
        qb.andWhere('bill.issueDate <= :endDate', { endDate: query.endDate });
      }
    }

    // 3. Category & Search filters
    if (query.category) {
      qb.andWhere('bill.category = :category', { category: query.category });
    }

    if (query.search) {
      qb.andWhere(
        '(bill.billNumber ILIKE :search OR bill.supplierName ILIKE :search OR bill.supplierContact ILIKE :search OR bill.supplierEmail ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('bill.issueDate', 'DESC').addOrderBy('bill.createdAt', 'DESC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Map overdue status dynamically
    const processedItems = items.map((bill) => {
      const bal = Number(bill.balanceDue || 0);
      if (
        bill.status !== FinanceBillStatusEnum.PAID &&
        bill.status !== FinanceBillStatusEnum.VOID &&
        bill.dueDate < today &&
        bal > 0
      ) {
        return {
          ...bill,
          status: FinanceBillStatusEnum.OVERDUE,
        };
      }
      return bill;
    });

    // 4. Period Summary Calculation (respects active period date range)
    const periodQb = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.storeId = :storeId', { storeId });

    if (query.startDate) {
      periodQb.andWhere('bill.issueDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      periodQb.andWhere('bill.issueDate <= :endDate', { endDate: query.endDate });
    }
    if (query.category) {
      periodQb.andWhere('bill.category = :category', { category: query.category });
    }

    const periodBills = await periodQb.getMany();

    let totalCount = periodBills.length;
    let paidCount = 0;
    let unpaidCount = 0;
    let partiallyPaidCount = 0;
    let overdueCount = 0;
    let totalBilled = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;

    for (const bill of periodBills) {
      const tot = Number(bill.totalAmount || 0);
      const paid = Number(bill.paidAmount || 0);
      const bal = Number(bill.balanceDue || 0);
      const isOverdue = bill.dueDate < today && bal > 0 && bill.status !== FinanceBillStatusEnum.VOID;

      totalBilled += tot;
      totalPaid += paid;

      if (bill.status === FinanceBillStatusEnum.PAID || (bal === 0 && tot > 0)) {
        paidCount++;
      } else if (bill.status === FinanceBillStatusEnum.PARTIALLY_PAID) {
        partiallyPaidCount++;
        totalUnpaid += bal;
        if (isOverdue) {
          overdueCount++;
          totalOverdue += bal;
        }
      } else if (bill.status === FinanceBillStatusEnum.UNPAID) {
        unpaidCount++;
        totalUnpaid += bal;
        if (isOverdue) {
          overdueCount++;
          totalOverdue += bal;
        }
      } else if (bill.status === FinanceBillStatusEnum.OVERDUE || isOverdue) {
        overdueCount++;
        totalUnpaid += bal;
        totalOverdue += bal;
      }
    }

    // 5. All-Time Outstanding Metrics (across all historical months)
    const allTimeBills = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere('CAST(bill.balanceDue AS decimal) > 0')
      .andWhere('bill.status NOT IN (:...nonOutstanding)', {
        nonOutstanding: [FinanceBillStatusEnum.PAID, FinanceBillStatusEnum.VOID],
      })
      .getMany();

    const allTimeOutstandingCount = allTimeBills.length;
    const allTimeOutstandingAmount = allTimeBills.reduce(
      (sum, b) => sum + Number(b.balanceDue || 0),
      0,
    );

    return {
      items: processedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalBilled,
        totalPaid,
        totalUnpaid,
        totalOverdue,
        totalCount,
        paidCount,
        unpaidCount,
        partiallyPaidCount,
        overdueCount,
        allTimeOutstandingCount,
        allTimeOutstandingAmount,
      },
    };
  }
}
