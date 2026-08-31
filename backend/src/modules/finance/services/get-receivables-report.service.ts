import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceInvoiceStatusEnum } from '../enums/finance.enums';

@Injectable()
export class GetReceivablesReportService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
  ) {}

  async execute(storeId: string) {
    const openInvoices = await this.invoiceRepository
      .createQueryBuilder('inv')
      .where('inv.storeId = :storeId', { storeId })
      .andWhere('inv.status IN (:...statuses)', {
        statuses: [
          FinanceInvoiceStatusEnum.UNPAID,
          FinanceInvoiceStatusEnum.PARTIALLY_PAID,
          FinanceInvoiceStatusEnum.OVERDUE,
        ],
      })
      .orderBy('inv.dueDate', 'ASC')
      .getMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aging = {
      current: 0,
      days1To30: 0,
      days31To60: 0,
      days61To90: 0,
      over90Days: 0,
      totalReceivables: 0,
    };

    const invoiceList = openInvoices.map((inv) => {
      const balanceDue = Number(inv.balanceDue || 0);
      aging.totalReceivables += balanceDue;

      const due = new Date(inv.dueDate);
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
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        customerPhone: inv.customerPhone,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        totalAmount: Number(inv.totalAmount || 0),
        paidAmount: Number(inv.paidAmount || 0),
        balanceDue,
        status: inv.status,
        daysOverdue: Math.max(0, diffDays),
        bucket,
      };
    });

    return {
      aging,
      invoices: invoiceList,
      currency: 'BDT',
    };
  }
}
