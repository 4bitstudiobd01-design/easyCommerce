import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import {
  JournalSourceEnum,
  JournalStatusEnum,
} from '../../accounting/entities/journal-entry.entity';
import { AccountMappingEventEnum } from '../../accounting/entities/account-mapping.entity';
import { PostJournalEntryService } from '../../accounting/services/post-journal-entry.service';
import { SupplierEntity } from '../entities/supplier.entity';
import { PurchaseOrderEntity } from '../entities/purchase-order.entity';
import { BillEntity, BillPaymentStatusEnum } from '../entities/bill.entity';
import { BillLineEntity } from '../entities/bill-line.entity';
import { PurchaseCounterKindEnum } from '../entities/purchase-counter.entity';
import { CreateBillDto } from '../dto/bill.dto';
import { AllocatePurchaseNumberService } from './allocate-purchase-number.service';
import { PurchasePostingHelper } from './purchase-posting.helper';
import { RecordSupplierPaymentService } from './record-supplier-payment.service';
import { fromCents, toCents } from './purchase-money.util';

/**
 * Records a supplier bill with product line items and, unless the store has auto-post
 * disabled, posts a balanced Accounts Payable journal entry:
 *
 *   DEBIT  Inventory (mapped INVENTORY_ASSET account)   full bill total
 *   CREDIT Accounts Payable (mapped ACCOUNTS_PAYABLE)   full bill total
 *
 * The entry is idempotent for (storeId, PURCHASE, bill.id). Any `paidAmount` on the DTO is
 * applied afterwards as a separate supplier payment (its own DEBIT AP / CREDIT Cash entry).
 */
@Injectable()
export class CreateBillService {
  constructor(
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    private readonly allocatePurchaseNumberService: AllocatePurchaseNumberService,
    private readonly postingHelper: PurchasePostingHelper,
    private readonly postJournalEntryService: PostJournalEntryService,
    private readonly recordSupplierPaymentService: RecordSupplierPaymentService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateBillDto,
    userId: string,
  ): Promise<BillEntity> {
    const supplier = await this.supplierRepository.findOne({
      where: { id: dto.supplierId, storeId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found in this store.');
    }

    if (dto.purchaseOrderId) {
      const po = await this.purchaseOrderRepository.findOne({
        where: { id: dto.purchaseOrderId, storeId },
      });
      if (!po) {
        throw new NotFoundException('Purchase order not found in this store.');
      }
    }

    const productIds = [...new Set(dto.lines.map((l) => l.productId))];
    const products = await this.productRepository.find({
      where: { id: In(productIds), tenantId },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products do not exist.');
    }
    const productById = new Map(products.map((p) => [p.id, p]));

    const variantIds = [
      ...new Set(dto.lines.map((l) => l.variantId).filter((v): v is string => !!v)),
    ];
    const variants = variantIds.length
      ? await this.variantRepository.find({ where: { id: In(variantIds), tenantId } })
      : [];
    if (variants.length !== variantIds.length) {
      throw new BadRequestException('One or more product variants do not exist.');
    }
    const variantById = new Map(variants.map((v) => [v.id, v]));

    let subtotalCents = 0;
    let itemsCount = 0;
    const lineRows = dto.lines.map((line, index) => {
      const product = productById.get(line.productId)!;
      const variant = line.variantId ? variantById.get(line.variantId) : undefined;
      if (variant && variant.productId !== product.id) {
        throw new BadRequestException(
          `Variant does not belong to product "${product.name}".`,
        );
      }
      const unitCostCents = toCents(line.unitCost);
      const lineTotalCents = unitCostCents * line.quantity;
      subtotalCents += lineTotalCents;
      itemsCount += line.quantity;
      return {
        storeId,
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        sku: variant?.sku ?? product.sku,
        quantity: line.quantity,
        unitCost: fromCents(unitCostCents),
        lineTotal: fromCents(lineTotalCents),
        lineOrder: index,
      };
    });

    const billNumber = await this.allocatePurchaseNumberService.execute(
      tenantId,
      storeId,
      PurchaseCounterKindEnum.BILL,
    );

    const autoPost = await this.postingHelper.autoPostEnabled(storeId);
    let debitAccountId: string | undefined;
    let creditAccountId: string | undefined;
    if (autoPost) {
      debitAccountId = await this.postingHelper.requireMappedAccountId(
        storeId,
        AccountMappingEventEnum.INVENTORY_ASSET,
        'Inventory',
      );
      creditAccountId = await this.postingHelper.requireMappedAccountId(
        storeId,
        AccountMappingEventEnum.ACCOUNTS_PAYABLE,
        'Accounts Payable',
      );
    }

    const bill = await this.dataSource.transaction(async (manager) => {
      const billRepo = manager.getRepository(BillEntity);
      const lineRepo = manager.getRepository(BillLineEntity);

      const saved = await billRepo.save(
        billRepo.create({
          tenantId,
          storeId,
          billNumber,
          supplierInvoiceNo: dto.supplierInvoiceNo?.trim(),
          supplierId: supplier.id,
          supplierName: supplier.name,
          purchaseOrderId: dto.purchaseOrderId,
          billDate: dto.billDate,
          dueDate: dto.dueDate,
          subtotal: fromCents(subtotalCents),
          totalAmount: fromCents(subtotalCents),
          paidAmount: '0.00',
          itemsCount,
          paymentStatus: BillPaymentStatusEnum.UNPAID,
          notes: dto.notes?.trim(),
          createdByUserId: userId,
        }),
      );

      await lineRepo.save(
        lineRows.map((row) => lineRepo.create({ ...row, billId: saved.id })),
      );

      return billRepo.findOne({
        where: { id: saved.id },
        relations: ['lines'],
      }) as Promise<BillEntity>;
    });

    if (autoPost && debitAccountId && creditAccountId) {
      const totalAmount = fromCents(subtotalCents);
      const journalEntry = await this.postJournalEntryService.execute(tenantId, storeId, {
        date: dto.billDate,
        description: `Bill ${billNumber} — ${supplier.name}`,
        reference: dto.supplierInvoiceNo?.trim(),
        status: JournalStatusEnum.POSTED,
        source: JournalSourceEnum.PURCHASE,
        sourceRef: bill.id,
        createdByUserId: userId,
        lines: [
          { accountId: debitAccountId, debit: totalAmount, memo: 'Inventory received' },
          {
            accountId: creditAccountId,
            credit: totalAmount,
            memo: `Payable to ${supplier.name}`,
          },
        ],
      });
      bill.journalEntryId = journalEntry.id;
      await this.billRepository.save(bill);
    }

    if (dto.paidAmount && dto.paidAmount > 0) {
      const capped = Math.min(toCents(dto.paidAmount), subtotalCents);
      if (capped > 0) {
        await this.recordSupplierPaymentService.execute(tenantId, storeId, {
          supplierId: supplier.id,
          billId: bill.id,
          paymentDate: dto.billDate,
          amount: Number(fromCents(capped)),
          method: dto.paymentMethod,
          paidFromAccountId: dto.paidFromAccountId,
        }, userId);
      }
    }

    return (await this.billRepository.findOne({
      where: { id: bill.id },
      relations: ['lines'],
    })) as BillEntity;
  }
}
