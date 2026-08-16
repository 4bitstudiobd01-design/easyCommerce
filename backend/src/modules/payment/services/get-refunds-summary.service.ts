import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { RefundEntity, RefundStatusEnum } from '../entities/refund.entity';

export interface RefundsSummary {
  totalRefunded: number;
  refundCount: number;
}

@Injectable()
export class GetRefundsSummaryService {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly refundRepository: Repository<RefundEntity>,
  ) {}

  /**
   * Tenant-wide sum of completed refunds in a date range. No prior service
   * aggregated refunds beyond a single order — this is a genuine new query,
   * not a reuse of existing logic. Only COMPLETED refunds count toward the
   * KPI; a REQUESTED/PROCESSING refund hasn't actually left the merchant's
   * account yet.
   */
  async execute(tenantId: string, dateFrom: Date, dateTo: Date): Promise<RefundsSummary> {
    const refunds = await this.refundRepository.find({
      where: {
        tenantId,
        status: RefundStatusEnum.COMPLETED,
        createdAt: Between(dateFrom, dateTo),
      },
    });

    return {
      totalRefunded: refunds.reduce((sum, r) => sum + Number(r.amount), 0),
      refundCount: refunds.length,
    };
  }
}
