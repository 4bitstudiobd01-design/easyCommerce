import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceRequisitionEntity } from '../entities/finance-requisition.entity';
import { ListRequisitionsQueryDto } from '../dto/finance-requisition.dto';

@Injectable()
export class ListRequisitionsService {
  constructor(
    @InjectRepository(FinanceRequisitionEntity)
    private readonly requisitionRepo: Repository<FinanceRequisitionEntity>,
  ) {}

  async execute(storeId: string, query: ListRequisitionsQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const qb = this.requisitionRepo
      .createQueryBuilder('req')
      .where('req.storeId = :storeId', { storeId });

    if (query.status) {
      qb.andWhere('req.status = :status', { status: query.status });
    }

    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        '(req.requisitionNumber ILIKE :term OR req.poNumber ILIKE :term OR req.supplierName ILIKE :term OR req.title ILIKE :term)',
        { term },
      );
    }

    qb.orderBy('req.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
