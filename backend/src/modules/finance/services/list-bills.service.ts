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

    const qb = this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.items', 'items')
      .where('bill.storeId = :storeId', { storeId });

    if (query.status) {
      qb.andWhere('bill.status = :status', { status: query.status });
    }

    if (query.category) {
      qb.andWhere('bill.category = :category', { category: query.category });
    }

    if (query.startDate) {
      qb.andWhere('bill.issueDate >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      qb.andWhere('bill.issueDate <= :endDate', { endDate: query.endDate });
    }

    if (query.search) {
      qb.andWhere(
        '(bill.billNumber ILIKE :search OR bill.supplierName ILIKE :search OR bill.supplierContact ILIKE :search OR bill.supplierEmail ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('bill.issueDate', 'DESC').addOrderBy('bill.createdAt', 'DESC');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Summary calculation
    const allBills = await this.billRepository.find({ where: { storeId } });
    let totalBilled = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;

    const today = new Date().toISOString().split('T')[0];

    for (const bill of allBills) {
      const tot = Number(bill.totalAmount || 0);
      const paid = Number(bill.paidAmount || 0);
      const bal = Number(bill.balanceDue || 0);

      totalBilled += tot;
      totalPaid += paid;
      if (bill.status !== FinanceBillStatusEnum.PAID && bill.status !== FinanceBillStatusEnum.VOID) {
        totalUnpaid += bal;
        if (bill.dueDate < today) {
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
        totalBilled,
        totalPaid,
        totalUnpaid,
        totalOverdue,
      },
    };
  }
}
