import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceChartOfAccountEntity } from '../entities/finance-chart-of-account.entity';
import { PostJournalEntryService } from './post-journal-entry.service';
import { SeedDefaultChartOfAccountsService } from './seed-default-chart-of-accounts.service';
import {
  FinanceJournalEntryTypeEnum,
  FinanceLineTypeEnum,
  FinancePartyTypeEnum,
} from '../enums/finance.enums';

@Injectable()
export class SyncModuleFinanceService {
  private readonly logger = new Logger(SyncModuleFinanceService.name);

  constructor(
    @InjectRepository(FinanceChartOfAccountEntity)
    private readonly coaRepository: Repository<FinanceChartOfAccountEntity>,
    private readonly postJournalEntryService: PostJournalEntryService,
    private readonly seederService: SeedDefaultChartOfAccountsService,
  ) {}

  private async getAccountByCode(storeId: string, code: string): Promise<FinanceChartOfAccountEntity | null> {
    return this.coaRepository.findOne({
      where: { storeId, code },
    });
  }

  /**
   * Syncs an online or prepaid order into double-entry ledger.
   */
  async syncOrderPaid(payload: {
    tenantId: string;
    storeId: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    taxAmount: number;
    grandTotal: number;
    estimatedCogs?: number;
    gatewayFee?: number;
    paymentMethod?: string;
  }) {
    try {
      await this.seederService.execute(payload.tenantId, payload.storeId);

      const accGateway = await this.getAccountByCode(payload.storeId, '1030');
      const accGatewayFee = await this.getAccountByCode(payload.storeId, '5030');
      const accDiscount = await this.getAccountByCode(payload.storeId, '4090');
      const accSales = await this.getAccountByCode(payload.storeId, '4010');
      const accShipping = await this.getAccountByCode(payload.storeId, '4020');
      const accTax = await this.getAccountByCode(payload.storeId, '2020');

      if (!accGateway || !accSales) return;

      const lines: any[] = [];
      const netReceived = payload.grandTotal - (payload.gatewayFee || 0);

      // Debit Payment Gateway Clearing
      lines.push({
        accountId: accGateway.id,
        type: FinanceLineTypeEnum.DEBIT,
        amount: netReceived > 0 ? netReceived : payload.grandTotal,
        description: `Online payment received for ${payload.orderNumber}`,
        partyType: FinancePartyTypeEnum.CUSTOMER,
        partyName: payload.customerName,
      });

      // Debit Gateway Fee if applicable
      if (payload.gatewayFee && payload.gatewayFee > 0 && accGatewayFee) {
        lines.push({
          accountId: accGatewayFee.id,
          type: FinanceLineTypeEnum.DEBIT,
          amount: payload.gatewayFee,
          description: `Payment processing fee for ${payload.orderNumber}`,
        });
      }

      // Debit Discounts if applied
      if (payload.discount && payload.discount > 0 && accDiscount) {
        lines.push({
          accountId: accDiscount.id,
          type: FinanceLineTypeEnum.DEBIT,
          amount: payload.discount,
          description: `Discount coupon for ${payload.orderNumber}`,
        });
      }

      // Credit Sales Revenue
      const salesCredit = (payload.subtotal || 0) + (payload.discount || 0);
      lines.push({
        accountId: accSales.id,
        type: FinanceLineTypeEnum.CREDIT,
        amount: salesCredit,
        description: `Merchandise sales for ${payload.orderNumber}`,
        partyType: FinancePartyTypeEnum.CUSTOMER,
        partyName: payload.customerName,
      });

      // Credit Shipping Revenue if collected
      if (payload.shippingFee && payload.shippingFee > 0 && accShipping) {
        lines.push({
          accountId: accShipping.id,
          type: FinanceLineTypeEnum.CREDIT,
          amount: payload.shippingFee,
          description: `Shipping charge for ${payload.orderNumber}`,
        });
      }

      // Credit Tax Payable if collected
      if (payload.taxAmount && payload.taxAmount > 0 && accTax) {
        lines.push({
          accountId: accTax.id,
          type: FinanceLineTypeEnum.CREDIT,
          amount: payload.taxAmount,
          description: `Sales Tax/VAT collected for ${payload.orderNumber}`,
        });
      }

      await this.postJournalEntryService.execute(
        payload.tenantId,
        payload.storeId,
        {
          entryDate: new Date().toISOString().split('T')[0],
          description: `Order Sales: ${payload.orderNumber} - ${payload.customerName}`,
          sourceType: FinanceJournalEntryTypeEnum.ORDER,
          sourceId: payload.orderId,
          sourceReference: payload.orderNumber,
          lines,
        },
        { reason: 'Auto-sync from Order Paid' },
      );

      // Post COGS & Inventory Asset entry if COGS estimation exists
      if (payload.estimatedCogs && payload.estimatedCogs > 0) {
        const accCogs = await this.getAccountByCode(payload.storeId, '5010');
        const accInventory = await this.getAccountByCode(payload.storeId, '1300');

        if (accCogs && accInventory) {
          await this.postJournalEntryService.execute(
            payload.tenantId,
            payload.storeId,
            {
              entryDate: new Date().toISOString().split('T')[0],
              description: `COGS Recognition: ${payload.orderNumber}`,
              sourceType: FinanceJournalEntryTypeEnum.ORDER,
              sourceId: payload.orderId,
              sourceReference: payload.orderNumber,
              lines: [
                {
                  accountId: accCogs.id,
                  type: FinanceLineTypeEnum.DEBIT,
                  amount: payload.estimatedCogs,
                  description: `Direct product cost for ${payload.orderNumber}`,
                },
                {
                  accountId: accInventory.id,
                  type: FinanceLineTypeEnum.CREDIT,
                  amount: payload.estimatedCogs,
                  description: `Inventory reduction for ${payload.orderNumber}`,
                },
              ],
            },
            { reason: 'Auto-sync COGS recognition' },
          );
        }
      }
    } catch (err) {
      this.logger.error(`Failed to sync order paid ${payload.orderNumber}:`, err);
    }
  }

  /**
   * Syncs a COD Order delivered.
   */
  async syncOrderCodDelivered(payload: {
    tenantId: string;
    storeId: string;
    orderId: string;
    orderNumber: string;
    customerName: string;
    courierName?: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    taxAmount: number;
    grandTotal: number;
    courierFee?: number;
    estimatedCogs?: number;
  }) {
    try {
      await this.seederService.execute(payload.tenantId, payload.storeId);

      const accCourierClearing = await this.getAccountByCode(payload.storeId, '1040');
      const accCourierExpense = await this.getAccountByCode(payload.storeId, '5040');
      const accDiscount = await this.getAccountByCode(payload.storeId, '4090');
      const accSales = await this.getAccountByCode(payload.storeId, '4010');
      const accShipping = await this.getAccountByCode(payload.storeId, '4020');
      const accTax = await this.getAccountByCode(payload.storeId, '2020');

      if (!accCourierClearing || !accSales) return;

      const lines: any[] = [];
      const netCodExpected = payload.grandTotal - (payload.courierFee || 0);

      // Debit Courier & COD Clearing
      lines.push({
        accountId: accCourierClearing.id,
        type: FinanceLineTypeEnum.DEBIT,
        amount: netCodExpected > 0 ? netCodExpected : payload.grandTotal,
        description: `COD Cash in transit with ${payload.courierName || 'Courier'} for ${payload.orderNumber}`,
        partyType: FinancePartyTypeEnum.COURIER,
        partyName: payload.courierName || 'Courier Partner',
      });

      // Debit Courier Delivery Fee if applicable
      if (payload.courierFee && payload.courierFee > 0 && accCourierExpense) {
        lines.push({
          accountId: accCourierExpense.id,
          type: FinanceLineTypeEnum.DEBIT,
          amount: payload.courierFee,
          description: `Courier fulfillment charge for ${payload.orderNumber}`,
        });
      }

      // Debit Discount
      if (payload.discount && payload.discount > 0 && accDiscount) {
        lines.push({
          accountId: accDiscount.id,
          type: FinanceLineTypeEnum.DEBIT,
          amount: payload.discount,
          description: `Discount coupon on ${payload.orderNumber}`,
        });
      }

      // Credit Sales Revenue
      const salesCredit = (payload.subtotal || 0) + (payload.discount || 0);
      lines.push({
        accountId: accSales.id,
        type: FinanceLineTypeEnum.CREDIT,
        amount: salesCredit,
        description: `Sales revenue on COD delivery for ${payload.orderNumber}`,
        partyType: FinancePartyTypeEnum.CUSTOMER,
        partyName: payload.customerName,
      });

      // Credit Shipping Revenue
      if (payload.shippingFee && payload.shippingFee > 0 && accShipping) {
        lines.push({
          accountId: accShipping.id,
          type: FinanceLineTypeEnum.CREDIT,
          amount: payload.shippingFee,
          description: `Shipping fee collected on ${payload.orderNumber}`,
        });
      }

      // Credit Tax
      if (payload.taxAmount && payload.taxAmount > 0 && accTax) {
        lines.push({
          accountId: accTax.id,
          type: FinanceLineTypeEnum.CREDIT,
          amount: payload.taxAmount,
          description: `VAT collected on ${payload.orderNumber}`,
        });
      }

      await this.postJournalEntryService.execute(
        payload.tenantId,
        payload.storeId,
        {
          entryDate: new Date().toISOString().split('T')[0],
          description: `COD Delivered: ${payload.orderNumber} - ${payload.customerName}`,
          sourceType: FinanceJournalEntryTypeEnum.ORDER,
          sourceId: payload.orderId,
          sourceReference: payload.orderNumber,
          lines,
        },
        { reason: 'Auto-sync from COD Delivered' },
      );

      // COGS Recognition
      if (payload.estimatedCogs && payload.estimatedCogs > 0) {
        const accCogs = await this.getAccountByCode(payload.storeId, '5010');
        const accInventory = await this.getAccountByCode(payload.storeId, '1300');

        if (accCogs && accInventory) {
          await this.postJournalEntryService.execute(
            payload.tenantId,
            payload.storeId,
            {
              entryDate: new Date().toISOString().split('T')[0],
              description: `COGS Recognition: ${payload.orderNumber}`,
              sourceType: FinanceJournalEntryTypeEnum.ORDER,
              sourceId: payload.orderId,
              sourceReference: payload.orderNumber,
              lines: [
                {
                  accountId: accCogs.id,
                  type: FinanceLineTypeEnum.DEBIT,
                  amount: payload.estimatedCogs,
                  description: `Product inventory cost for ${payload.orderNumber}`,
                },
                {
                  accountId: accInventory.id,
                  type: FinanceLineTypeEnum.CREDIT,
                  amount: payload.estimatedCogs,
                  description: `Inventory reduction for ${payload.orderNumber}`,
                },
              ],
            },
            { reason: 'Auto-sync COD COGS' },
          );
        }
      }
    } catch (err) {
      this.logger.error(`Failed to sync COD delivered ${payload.orderNumber}:`, err);
    }
  }

  /**
   * Syncs Courier COD Remittance into Bank account.
   */
  async syncCodRemittance(payload: {
    tenantId: string;
    storeId: string;
    courierName: string;
    remittanceReference: string;
    amount: number;
    bankAccountId?: string;
  }) {
    try {
      await this.seederService.execute(payload.tenantId, payload.storeId);

      const accBank = payload.bankAccountId
        ? await this.coaRepository.findOne({ where: { id: payload.bankAccountId, storeId: payload.storeId } })
        : await this.getAccountByCode(payload.storeId, '1020');
      const accCourierClearing = await this.getAccountByCode(payload.storeId, '1040');

      if (!accBank || !accCourierClearing) return;

      await this.postJournalEntryService.execute(
        payload.tenantId,
        payload.storeId,
        {
          entryDate: new Date().toISOString().split('T')[0],
          description: `COD Settlement from ${payload.courierName}: ${payload.remittanceReference}`,
          sourceType: FinanceJournalEntryTypeEnum.TRANSFER,
          sourceReference: payload.remittanceReference,
          lines: [
            {
              accountId: accBank.id,
              type: FinanceLineTypeEnum.DEBIT,
              amount: payload.amount,
              description: `COD cash deposited into bank`,
            },
            {
              accountId: accCourierClearing.id,
              type: FinanceLineTypeEnum.CREDIT,
              amount: payload.amount,
              description: `Cleared COD in-transit funds from ${payload.courierName}`,
              partyType: FinancePartyTypeEnum.COURIER,
              partyName: payload.courierName,
            },
          ],
        },
        { reason: 'Courier COD Remittance' },
      );
    } catch (err) {
      this.logger.error(`Failed to sync COD remittance:`, err);
    }
  }

  /**
   * Syncs a manual expense transaction into double-entry ledger.
   */
  async syncExpenseTransaction(payload: {
    tenantId: string;
    storeId: string;
    transactionNumber: string;
    amount: number;
    transactionDate: string;
    categoryCode?: string;
    description?: string;
    paymentMethod?: string;
    accountId?: string;
  }) {
    try {
      await this.seederService.execute(payload.tenantId, payload.storeId);

      // Map categoryCode to OPEX/COGS account code
      const catCodeMap: Record<string, string> = {
        COGS: '5010',
        MARKETING: '6030',
        SHIPPING: '5040',
        SALARY: '6010',
        EMPLOYEE_EXPENSE: '6020',
        RENT: '6050',
        UTILITIES: '6060',
        SOFTWARE: '6040',
        OTHER: '6090',
      };
      const coaCode = (payload.categoryCode && catCodeMap[payload.categoryCode]) || '6090';

      const accExpense = await this.getAccountByCode(payload.storeId, coaCode);
      const accPayment = payload.accountId
        ? await this.coaRepository.findOne({ where: { id: payload.accountId, storeId: payload.storeId } })
        : (await this.getAccountByCode(payload.storeId, '1010')) || (await this.getAccountByCode(payload.storeId, '1020'));

      if (!accExpense || !accPayment) return;

      await this.postJournalEntryService.execute(
        payload.tenantId,
        payload.storeId,
        {
          entryDate: payload.transactionDate || new Date().toISOString().split('T')[0],
          description: payload.description || `Business Expense: ${payload.categoryCode || 'OPERATIONAL'} [${payload.transactionNumber}]`,
          sourceType: FinanceJournalEntryTypeEnum.MANUAL,
          sourceReference: payload.transactionNumber,
          lines: [
            {
              accountId: accExpense.id,
              type: FinanceLineTypeEnum.DEBIT,
              amount: payload.amount,
              description: payload.description || `Expense charge`,
            },
            {
              accountId: accPayment.id,
              type: FinanceLineTypeEnum.CREDIT,
              amount: payload.amount,
              description: `Payment from ${accPayment.name}`,
            },
          ],
        },
        { reason: 'Auto-sync from Record Expense' },
      );
    } catch (err) {
      this.logger.error(`Failed to sync expense journal entry for ${payload.transactionNumber}:`, err);
    }
  }

  /**
   * Syncs a manual income transaction into double-entry ledger.
   */
  async syncIncomeTransaction(payload: {
    tenantId: string;
    storeId: string;
    transactionNumber: string;
    amount: number;
    transactionDate: string;
    categoryCode?: string;
    description?: string;
    accountId?: string;
  }) {
    try {
      await this.seederService.execute(payload.tenantId, payload.storeId);

      const catCodeMap: Record<string, string> = {
        PRODUCT_SALES: '4010',
        SHIPPING: '4020',
        OTHER: '4030',
      };
      const coaCode = (payload.categoryCode && catCodeMap[payload.categoryCode]) || '4030';

      const accRevenue = await this.getAccountByCode(payload.storeId, coaCode);
      const accAsset = payload.accountId
        ? await this.coaRepository.findOne({ where: { id: payload.accountId, storeId: payload.storeId } })
        : (await this.getAccountByCode(payload.storeId, '1020')) || (await this.getAccountByCode(payload.storeId, '1010'));

      if (!accRevenue || !accAsset) return;

      await this.postJournalEntryService.execute(
        payload.tenantId,
        payload.storeId,
        {
          entryDate: payload.transactionDate || new Date().toISOString().split('T')[0],
          description: payload.description || `Income: ${payload.categoryCode || 'REVENUE'} [${payload.transactionNumber}]`,
          sourceType: FinanceJournalEntryTypeEnum.MANUAL,
          sourceReference: payload.transactionNumber,
          lines: [
            {
              accountId: accAsset.id,
              type: FinanceLineTypeEnum.DEBIT,
              amount: payload.amount,
              description: `Funds received into ${accAsset.name}`,
            },
            {
              accountId: accRevenue.id,
              type: FinanceLineTypeEnum.CREDIT,
              amount: payload.amount,
              description: payload.description || `Revenue recognized`,
            },
          ],
        },
        { reason: 'Auto-sync from Record Income' },
      );
    } catch (err) {
      this.logger.error(`Failed to sync income journal entry for ${payload.transactionNumber}:`, err);
    }
  }
}
