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

    const qb = this.invoiceRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.items', 'items')
      .where('inv.storeId = :storeId', { storeId });

    if (query.status) {
      qb.andWhere('inv.status = :status', { status: query.status });
    }

    if (query.customerId) {
      qb.andWhere('inv.customerId = :customerId', { customerId: query.customerId });
    }

    if (query.startDate) {
      qb.andWhere('inv.issueDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('inv.issueDate <= :endDate', { endDate: query.endDate });
    }

    if (query.search) {
      qb.andWhere(
        '(inv.invoiceNumber ILIKE :search OR inv.customerName ILIKE :search OR inv.customerEmail ILIKE :search OR inv.customerPhone ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('inv.issueDate', 'DESC').addOrderBy('inv.createdAt', 'DESC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Summary calculation
    const allInvoices = await this.invoiceRepository.find({ where: { storeId } });
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;

    const today = new Date().toISOString().split('T')[0];

    for (const inv of allInvoices) {
      const tot = Number(inv.totalAmount || 0);
      const paid = Number(inv.paidAmount || 0);
      const bal = Number(inv.balanceDue || 0);

      totalInvoiced += tot;
      totalPaid += paid;
      if (inv.status !== FinanceInvoiceStatusEnum.PAID && inv.status !== FinanceInvoiceStatusEnum.VOID) {
        totalUnpaid += bal;
        if (inv.dueDate < today) {
          totalOverdue += bal;
        }
      }
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalInvoiced,
        totalPaid,
        totalUnpaid,
        totalOverdue,
      },
    };
  }
}
