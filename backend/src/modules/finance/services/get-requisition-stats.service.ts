import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceRequisitionEntity } from '../entities/finance-requisition.entity';
import { FinanceRequisitionStatusEnum } from '../enums/finance.enums';

export interface RequisitionStatsSummary {
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  rejectedCount: number;
  totalRequestedCount: number;
  totalRequestedAmount: number;
}

@Injectable()
export class GetRequisitionStatsService {
  constructor(
    @InjectRepository(FinanceRequisitionEntity)
    private readonly requisitionRepo: Repository<FinanceRequisitionEntity>,
  ) {}

  async execute(storeId: string): Promise<RequisitionStatsSummary> {
    const rows = await this.requisitionRepo
      .createQueryBuilder('req')
      .select('req.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(CAST(req.requestedAmount AS decimal)), 0)', 'amount')
      .where('req.storeId = :storeId', { storeId })
      .groupBy('req.status')
      .getRawMany<{ status: string; count: string; amount: string }>();

    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let rejectedCount = 0;
    let totalRequestedCount = 0;
    let totalRequestedAmount = 0;

    for (const row of rows) {
      const c = Number(row.count) || 0;
      const a = Number(row.amount) || 0;

      totalRequestedCount += c;
      totalRequestedAmount += a;

      if (row.status === FinanceRequisitionStatusEnum.PENDING) {
        pendingCount = c;
        pendingAmount = a;
      } else if (row.status === FinanceRequisitionStatusEnum.APPROVED) {
        approvedCount = c;
        approvedAmount = a;
      } else if (row.status === FinanceRequisitionStatusEnum.REJECTED) {
        rejectedCount = c;
      }
    }

    return {
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      rejectedCount,
      totalRequestedCount,
      totalRequestedAmount,
    };
  }
}
