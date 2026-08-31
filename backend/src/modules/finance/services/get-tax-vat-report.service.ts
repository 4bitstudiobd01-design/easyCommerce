import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceInvoiceEntity } from '../entities/finance-invoice.entity';
import { FinanceBillEntity } from '../entities/finance-bill.entity';
import { FinanceJournalLineEntity } from '../entities/finance-journal-line.entity';
import { QueryFinancialReportDto } from '../dto/financial-reports.dto';
import { resolveDateRange } from './get-profit-loss-report.service';
import { FinanceJournalStatusEnum } from '../enums/finance.enums';

@Injectable()
export class GetTaxVatReportService {
  constructor(
    @InjectRepository(FinanceInvoiceEntity)
    private readonly invoiceRepository: Repository<FinanceInvoiceEntity>,
    @InjectRepository(FinanceBillEntity)
    private readonly billRepository: Repository<FinanceBillEntity>,
    @InjectRepository(FinanceJournalLineEntity)
    private readonly journalLineRepository: Repository<FinanceJournalLineEntity>,
  ) {}

  async execute(storeId: string, query: QueryFinancialReportDto) {
    const { startDate, endDate } = resolveDateRange(query);

    // 1. Output VAT from Invoices in period
    const invoices = await this.invoiceRepository
      .createQueryBuilder('inv')
      .where('inv.storeId = :storeId', { storeId })
      .andWhere('inv.issueDate >= :startDate', { startDate })
      .andWhere('inv.issueDate <= :endDate', { endDate })
      .andWhere('inv.status != :voidStatus', { voidStatus: 'VOID' })
      .getMany();

    const outputVatInvoices = invoices.map((inv) => ({
      id: inv.id,
      number: inv.invoiceNumber,
      customerName: inv.customerName,
      date: inv.issueDate,
      taxableAmount: Number(inv.subtotal || 0),
      taxAmount: Number(inv.taxAmount || 0),
      totalAmount: Number(inv.totalAmount || 0),
      status: inv.status,
    }));

    const totalOutputVat = outputVatInvoices.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalTaxableSales = outputVatInvoices.reduce((sum, item) => sum + item.taxableAmount, 0);

    // 2. Input VAT from Bills in period
    const bills = await this.billRepository
      .createQueryBuilder('bill')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere('bill.issueDate >= :startDate', { startDate })
      .andWhere('bill.issueDate <= :endDate', { endDate })
      .andWhere('bill.status != :voidStatus', { voidStatus: 'VOID' })
      .getMany();

    const inputVatBills = bills.map((bill) => ({
      id: bill.id,
      number: bill.billNumber,
      supplierName: bill.supplierName,
      date: bill.issueDate,
      taxableAmount: Number(bill.subtotal || 0),
      taxAmount: Number(bill.taxAmount || 0),
      totalAmount: Number(bill.totalAmount || 0),
      status: bill.status,
    }));

    const totalInputVat = inputVatBills.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalTaxablePurchases = inputVatBills.reduce((sum, item) => sum + item.taxableAmount, 0);

    // 3. Tax / VAT Account 2020 Balance from Ledger
    const taxLines = await this.journalLineRepository
      .createQueryBuilder('jl')
      .innerJoin('jl.journalEntry', 'je')
      .where('jl.storeId = :storeId', { storeId })
      .andWhere('jl.accountCode = :taxCode', { taxCode: '2020' })
      .andWhere('je.status = :status', { status: FinanceJournalStatusEnum.POSTED })
      .andWhere('je.entryDate <= :endDate', { endDate })
      .select('jl.type', 'type')
      .addSelect('SUM(CAST(jl.amount AS decimal))', 'total')
      .groupBy('jl.type')
      .getRawMany();

    let taxDebits = 0;
    let taxCredits = 0;
    for (const row of taxLines) {
      if (row.type === 'DEBIT') taxDebits = Number(row.total || 0);
      else if (row.type === 'CREDIT') taxCredits = Number(row.total || 0);
    }
    const currentTaxLiabilityBalance = Math.round((taxCredits - taxDebits) * 100) / 100;

    const netVatPayable = Math.round((totalOutputVat - totalInputVat) * 100) / 100;

    return {
      dateRange: { startDate, endDate },
      summary: {
        totalTaxableSales: Math.round(totalTaxableSales * 100) / 100,
        outputVatCollected: Math.round(totalOutputVat * 100) / 100,
        totalTaxablePurchases: Math.round(totalTaxablePurchases * 100) / 100,
        inputVatPaid: Math.round(totalInputVat * 100) / 100,
        netVatPayable,
        currentTaxLiabilityBalance,
      },
      outputVatInvoices,
      inputVatBills,
      currency: 'BDT',
    };
  }
}
