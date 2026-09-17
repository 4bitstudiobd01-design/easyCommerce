import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { ListInvoicesQueryDto } from '../dto/finance-query.dto';
import { FinanceInvoiceStatusEnum } from '../enums/finance.enums';

@Injectable()
export class ListInvoicesService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
  ) {}

  async execute(storeId: string, query: ListInvoicesQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;
    const today = new Date().toISOString().split('T')[0];

    const qb = this.invoiceRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.storeId = :storeId', { storeId });

    const isOutstandingFilter = query.status === 'OUTSTANDING';

    // 1. Status filter handling
    if (isOutstandingFilter) {
      // OUTSTANDING: Any invoice with balanceDue > 0 across ALL historical months (ignores date range)
      qb.andWhere('CAST(inv.balanceDue AS decimal) > 0')
        .andWhere('inv.status NOT IN (:...nonOutstanding)', {
          nonOutstanding: [FinanceInvoiceStatusEnum.PAID, FinanceInvoiceStatusEnum.VOID],
        });
    } else if (query.status === 'OVERDUE') {
      qb.andWhere(
        '(inv.status = :overdueStatus OR (inv.status IN (:...unpaidStatuses) AND inv.dueDate < :today AND CAST(inv.balanceDue AS decimal) > 0))',
        {
          overdueStatus: FinanceInvoiceStatusEnum.OVERDUE,
          unpaidStatuses: [FinanceInvoiceStatusEnum.UNPAID, FinanceInvoiceStatusEnum.PARTIALLY_PAID],
          today,
        },
      );
    } else if (query.status === 'UNPAID') {
      qb.andWhere('inv.status = :unpaidStatus', { unpaidStatus: FinanceInvoiceStatusEnum.UNPAID });
    } else if (query.status === 'PARTIALLY_PAID') {
      qb.andWhere('inv.status = :partialStatus', { partialStatus: FinanceInvoiceStatusEnum.PARTIALLY_PAID });
    } else if (query.status === 'PAID') {
      qb.andWhere('inv.status = :paidStatus', { paidStatus: FinanceInvoiceStatusEnum.PAID });
    } else if (query.status && query.status !== 'ALL') {
      qb.andWhere('inv.status = :status', { status: query.status });
    }

    // 2. Date filters (Applied unless user specifically asked for ALL-TIME OUTSTANDING)
    if (!isOutstandingFilter) {
      if (query.startDate) {
        qb.andWhere('inv.issueDate >= :startDate', { startDate: query.startDate });
      }
      if (query.endDate) {
        qb.andWhere('inv.issueDate <= :endDate', { endDate: query.endDate });
      }
    }

    // 3. Customer & Search filters
    if (query.customerId) {
      qb.andWhere('inv.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.search) {
      qb.andWhere(
        '(inv.invoiceNumber ILIKE :search OR inv.customerName ILIKE :search OR inv.customerEmail ILIKE :search OR inv.customerPhone ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('inv.issueDate', 'DESC').addOrderBy('inv.createdAt', 'DESC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Map overdue status dynamically
    const processedItems = items.map((inv) => {
      const bal = Number(inv.balanceDue || 0);
      if (
        inv.status !== FinanceInvoiceStatusEnum.PAID &&
        inv.status !== FinanceInvoiceStatusEnum.VOID &&
        inv.dueDate < today &&
        bal > 0
      ) {
        return {
          ...inv,
          status: FinanceInvoiceStatusEnum.OVERDUE,
        };
      }
      return inv;
    });

    // 4. Period Summary Calculation (respects active period date range)
    const periodQb = this.invoiceRepository
      .createQueryBuilder('inv')
      .where('inv.storeId = :storeId', { storeId });

    if (query.startDate) {
      periodQb.andWhere('inv.issueDate >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      periodQb.andWhere('inv.issueDate <= :endDate', { endDate: query.endDate });
    }
    if (query.customerId) {
      periodQb.andWhere('inv.customerId = :customerId', { customerId: query.customerId });
    }

    const periodInvoices = await periodQb.getMany();

    let totalCount = periodInvoices.length;
    let paidCount = 0;
    let unpaidCount = 0;
    let partiallyPaidCount = 0;
    let overdueCount = 0;
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;

    for (const inv of periodInvoices) {
      const tot = Number(inv.totalAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      const bal = Number(inv.balanceDue || 0);
      const isOverdue = inv.dueDate < today && bal > 0 && inv.status !== FinanceInvoiceStatusEnum.VOID;

      totalInvoiced += tot;
      totalPaid += paid;

      if (inv.status === FinanceInvoiceStatusEnum.PAID || (bal === 0 && tot > 0)) {
        paidCount++;
      } else if (inv.status === FinanceInvoiceStatusEnum.PARTIALLY_PAID) {
        partiallyPaidCount++;
        totalUnpaid += bal;
        if (isOverdue) {
          overdueCount++;
          totalOverdue += bal;
        }
      } else if (inv.status === FinanceInvoiceStatusEnum.UNPAID) {
        unpaidCount++;
        totalUnpaid += bal;
        if (isOverdue) {
          overdueCount++;
          totalOverdue += bal;
        }
      } else if (inv.status === FinanceInvoiceStatusEnum.OVERDUE || isOverdue) {
        overdueCount++;
        totalUnpaid += bal;
        totalOverdue += bal;
      }
    }

    // 5. All-Time Outstanding Metrics (across all historical months)
    const allTimeInvoices = await this.invoiceRepository
      .createQueryBuilder('inv')
      .where('inv.storeId = :storeId', { storeId })
      .andWhere('CAST(inv.balanceDue AS decimal) > 0')
      .andWhere('inv.status NOT IN (:...nonOutstanding)', {
        nonOutstanding: [FinanceInvoiceStatusEnum.PAID, FinanceInvoiceStatusEnum.VOID],
      })
      .getMany();

    const allTimeOutstandingCount = allTimeInvoices.length;
    const allTimeOutstandingAmount = allTimeInvoices.reduce(
      (sum, inv) => sum + Number(inv.balanceDue || 0),
      0,
    );

    return {
      items: processedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalInvoiced,
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
