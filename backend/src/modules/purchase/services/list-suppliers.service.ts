import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { SupplierEntity } from '../entities/supplier.entity';
import { BillEntity } from '../entities/bill.entity';
import { ListSuppliersQueryDto } from '../dto/supplier.dto';

export interface SupplierListItem extends SupplierEntity {
  /** Σ of this supplier's bill totals in the store. */
  totalPurchases: string;
  /** openingBalance + Σ(bill.totalAmount − bill.paidAmount) for non-cancelled bills. */
  outstandingDue: string;
}

export interface PaginatedSuppliers {
  items: SupplierListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Paginated, filterable supplier list for the Purchase → Suppliers page. `totalPurchases`
 * and `outstandingDue` are aggregated from the store's bills at read time rather than stored
 * on the supplier row, so a payment never has to fan out and rewrite supplier records.
 */
@Injectable()
export class ListSuppliersService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
  ) {}

  async execute(
    storeId: string,
    query: ListSuppliersQueryDto,
  ): Promise<PaginatedSuppliers> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const qb = this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.storeId = :storeId', { storeId });

    if (query.status) {
      qb.andWhere('supplier.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((w) => {
          w.where('supplier.name ILIKE :s', { s: `%${query.search}%` })
            .orWhere('supplier.contactPerson ILIKE :s', { s: `%${query.search}%` })
            .orWhere('supplier.email ILIKE :s', { s: `%${query.search}%` })
            .orWhere('supplier.phone ILIKE :s', { s: `%${query.search}%` })
            .orWhere('supplier.location ILIKE :s', { s: `%${query.search}%` });
        }),
      );
    }

    // "purchases_desc" / "due_desc" need the aggregates, so those sorts are applied in JS
    // after the page is fetched by name; name sorts are applied in SQL.
    const aggregateSort = query.sort === 'purchases_desc' || query.sort === 'due_desc';
    if (query.sort === 'name_desc') {
      qb.orderBy('supplier.name', 'DESC');
    } else {
      qb.orderBy('supplier.name', 'ASC');
    }

    const [suppliers, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const supplierIds = suppliers.map((s) => s.id);
    const aggregates = new Map<string, { totalPurchases: number; due: number }>();
    if (supplierIds.length > 0) {
      const rows = await this.billRepository
        .createQueryBuilder('bill')
        .select('bill.supplierId', 'supplierId')
        .addSelect('COALESCE(SUM(bill.totalAmount), 0)', 'totalPurchases')
        .addSelect('COALESCE(SUM(bill.totalAmount - bill.paidAmount), 0)', 'due')
        .where('bill.storeId = :storeId', { storeId })
        .andWhere('bill.supplierId IN (:...supplierIds)', { supplierIds })
        .andWhere("bill.status != 'CANCELLED'")
        .groupBy('bill.supplierId')
        .getRawMany<{ supplierId: string; totalPurchases: string; due: string }>();
      for (const row of rows) {
        aggregates.set(row.supplierId, {
          totalPurchases: Number(row.totalPurchases),
          due: Number(row.due),
        });
      }
    }

    let items: SupplierListItem[] = suppliers.map((supplier) => {
      const agg = aggregates.get(supplier.id);
      const totalPurchases = agg?.totalPurchases ?? 0;
      const outstandingDue = (agg?.due ?? 0) + Number(supplier.openingBalance);
      return Object.assign(supplier, {
        totalPurchases: totalPurchases.toFixed(2),
        outstandingDue: outstandingDue.toFixed(2),
      });
    });

    if (aggregateSort) {
      const key = query.sort === 'purchases_desc' ? 'totalPurchases' : 'outstandingDue';
      items = items.sort((a, b) => Number(b[key]) - Number(a[key]));
    }

    return { items, total, page, limit };
  }
}
