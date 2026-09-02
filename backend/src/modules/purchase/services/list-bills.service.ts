import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BillEntity } from '../entities/bill.entity';
import { ListBillsQueryDto } from '../dto/bill.dto';

export interface BillListItem extends Omit<BillEntity, 'lines'> {
  /** totalAmount − paidAmount, fixed(2). */
  dueAmount: string;
}

export interface PaginatedBills {
  items: BillListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Paginated, filterable bill list for the Purchase → Purchases page. Lines are not loaded
 * here; the detail endpoint returns them.
 */
@Injectable()
export class ListBillsService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
  ) {}

  async execute(storeId: string, query: ListBillsQueryDto): Promise<PaginatedBills> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const qb = this.billRepository
      .createQueryBuilder('bill')
      .where('bill.storeId = :storeId', { storeId });

    if (query.status) {
      qb.andWhere('bill.paymentStatus = :status', { status: query.status });
    }
    if (query.supplierId) {
      qb.andWhere('bill.supplierId = :supplierId', { supplierId: query.supplierId });
    }
    if (query.from) {
      qb.andWhere('bill.billDate >= :from', { from: query.from });
    }
    if (query.to) {
      qb.andWhere('bill.billDate <= :to', { to: query.to });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('bill.billNumber ILIKE :s', { s: `%${query.search}%` })
            .orWhere('bill.supplierName ILIKE :s', { s: `%${query.search}%` })
            .orWhere('bill.supplierInvoiceNo ILIKE :s', { s: `%${query.search}%` });
        }),
      );
    }

    const [bills, total] = await qb
      .orderBy('bill.billDate', 'DESC')
      .addOrderBy('bill.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const items: BillListItem[] = bills.map((bill) => {
      const dueAmount = Number(bill.totalAmount) - Number(bill.paidAmount);
      return Object.assign(bill, { dueAmount: dueAmount.toFixed(2) });
    });

    return { items, total, page, limit };
  }
}
