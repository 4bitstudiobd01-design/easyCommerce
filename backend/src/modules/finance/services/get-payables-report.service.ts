import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { FinanceBillStatusEnum } from '../enums/finance.enums';

@Injectable()
export class GetPayablesReportService {
  constructor(
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
  ) {}

  async execute(storeId: string) {
    const openBills = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere('bill.status IN (:...statuses)', {
        statuses: [
          FinanceBillStatusEnum.UNPAID,
          FinanceBillStatusEnum.PARTIALLY_PAID,
          FinanceBillStatusEnum.OVERDUE,
        ],
      })
      .orderBy('bill.dueDate', 'ASC')
      .getMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aging = {
      current: 0,
      days1To30: 0,
      days31To60: 0,
      days61To90: 0,
      over90Days: 0,
      totalPayables: 0,
    };

    const billList = openBills.map((bill) => {
      const balanceDue = Number(bill.balanceDue || 0);
      aging.totalPayables += balanceDue;

      const due = new Date(bill.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let bucket: string;
      if (diffDays <= 0) {
        bucket = 'CURRENT';
        aging.current += balanceDue;
      } else if (diffDays <= 30) {
        bucket = '1-30 DAYS';
        aging.days1To30 += balanceDue;
      } else if (diffDays <= 60) {
        bucket = '31-60 DAYS';
        aging.days31To60 += balanceDue;
      } else if (diffDays <= 90) {
        bucket = '61-90 DAYS';
        aging.days61To90 += balanceDue;
      } else {
        bucket = '90+ DAYS';
        aging.over90Days += balanceDue;
      }

      return {
        id: bill.id,
        billNumber: bill.billNumber,
        supplierName: bill.supplierName,
        supplierContact: bill.supplierContact,
        supplierEmail: bill.supplierEmail,
        category: bill.category,
        issueDate: bill.issueDate,
        dueDate: bill.dueDate,
        totalAmount: Number(bill.totalAmount || 0),
        paidAmount: Number(bill.paidAmount || 0),
        balanceDue,
        status: bill.status,
        daysOverdue: Math.max(0, diffDays),
        bucket,
      };
    });

    return {
      aging,
      bills: billList,
      currency: 'BDT',
    };
  }
}
