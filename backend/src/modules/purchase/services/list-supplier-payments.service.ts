import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierPaymentEntity } from '../entities/supplier-payment.entity';
import { ListSupplierPaymentsQueryDto } from '../dto/supplier-payment.dto';

export interface PaginatedSupplierPayments {
  items: SupplierPaymentEntity[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Paginated supplier-payment list, filterable by bill or supplier. Newest first.
 */
@Injectable()
export class ListSupplierPaymentsService {
  constructor(
    @InjectRepository(SupplierPaymentEntity)
    private readonly paymentRepository: Repository<SupplierPaymentEntity>,
  ) {}

  async execute(
    storeId: string,
    query: ListSupplierPaymentsQueryDto,
  ): Promise<PaginatedSupplierPayments> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.storeId = :storeId', { storeId });

    if (query.billId) {
      qb.andWhere('payment.billId = :billId', { billId: query.billId });
    }
    if (query.supplierId) {
      qb.andWhere('payment.supplierId = :supplierId', { supplierId: query.supplierId });
    }

    const [items, total] = await qb
      .orderBy('payment.paymentDate', 'DESC')
      .addOrderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }
}
