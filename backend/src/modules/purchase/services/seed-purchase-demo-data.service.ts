import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { SupplierEntity } from '../entities/supplier.entity';
import { PurchaseOrderEntity } from '../entities/purchase-order.entity';
import { BillEntity } from '../entities/bill.entity';
import { CreateSupplierService } from './create-supplier.service';
import { CreatePurchaseOrderService } from './create-purchase-order.service';
import { ReceivePurchaseOrderService } from './receive-purchase-order.service';
import { CreateBillService } from './create-bill.service';
import { RecordSupplierPaymentService } from './record-supplier-payment.service';

export interface SeedPurchaseDemoResult {
  success: boolean;
  message: string;
  suppliersCreated: number;
  purchaseOrdersCreated: number;
  billsCreated: number;
  paymentsCreated: number;
}

const DEMO_SUPPLIERS = [
  { name: 'ABC Wholesale', contactPerson: 'Arif Rahman', phone: '+880 1712-345678', email: 'arif@abcwholesale.com', location: 'Dhaka, Bangladesh' },
  { name: 'Fashion Mart', contactPerson: 'Nusrat Jahan', phone: '+880 1811-223344', email: 'nusrat@fashionmart.com', location: 'Chittagong, Bangladesh' },
  { name: 'Style Traders', contactPerson: 'Kamal Hossain', phone: '+880 1911-556677', email: 'kamal@styletraders.com', location: 'Sylhet, Bangladesh' },
  { name: 'Global Imports', contactPerson: 'Sadia Islam', phone: '+880 1611-889900', email: 'sadia@globalimports.com', location: 'Khulna, Bangladesh' },
  { name: 'Top Goods Ltd.', contactPerson: 'Rezaul Karim', phone: '+880 1511-101010', email: 'rezaul@topgoods.com', location: 'Rajshahi, Bangladesh' },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Seeds demo suppliers, purchase orders and bills so the Purchase dashboard shows data
 * immediately in dev. Idempotent — if demo suppliers already exist it does nothing. Uses the
 * real services so every invariant (numbering, ledger posting, stock-in) is exercised.
 */
@Injectable()
export class SeedPurchaseDemoDataService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
    private readonly createSupplierService: CreateSupplierService,
    private readonly createPurchaseOrderService: CreatePurchaseOrderService,
    private readonly receivePurchaseOrderService: ReceivePurchaseOrderService,
    private readonly createBillService: CreateBillService,
    private readonly recordSupplierPaymentService: RecordSupplierPaymentService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId?: string,
  ): Promise<SeedPurchaseDemoResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'The purchase demo seeder is disabled in production environments.',
      );
    }

    const actor = userId ?? '00000000-0000-0000-0000-000000000000';

    const existing = await this.supplierRepository.count({ where: { storeId } });
    if (existing > 0) {
      return {
        success: true,
        message: 'Purchase demo data already present — nothing seeded.',
        suppliersCreated: 0,
        purchaseOrdersCreated: 0,
        billsCreated: 0,
        paymentsCreated: 0,
      };
    }

    const products = await this.productRepository.find({
      where: { tenantId },
      take: 6,
      order: { createdAt: 'ASC' },
    });
    if (products.length === 0) {
      return {
        success: false,
        message: 'No catalog products found — add products before seeding purchase data.',
        suppliersCreated: 0,
        purchaseOrdersCreated: 0,
        billsCreated: 0,
        paymentsCreated: 0,
      };
    }

    const suppliers: SupplierEntity[] = [];
    for (const demo of DEMO_SUPPLIERS) {
      suppliers.push(
        await this.createSupplierService.execute(tenantId, storeId, demo, actor),
      );
    }

    const pickLines = (offset: number, count: number) =>
      Array.from({ length: count }).map((_, i) => {
        const product = products[(offset + i) % products.length];
        return {
          productId: product.id,
          quantity: 5 + ((offset + i) % 4) * 5,
          unitCost: Number((100 + ((offset + i) % 5) * 40).toFixed(2)),
        };
      });

    let purchaseOrdersCreated = 0;
    let billsCreated = 0;
    let paymentsCreated = 0;

    // 1) Draft PO.
    await this.createPurchaseOrderService.execute(
      tenantId,
      storeId,
      {
        supplierId: suppliers[0].id,
        orderDate: daysAgo(3),
        expectedDate: daysAgo(-7),
        status: 'DRAFT',
        notes: 'Demo draft purchase order.',
        lines: pickLines(0, 2),
      },
      actor,
    );
    purchaseOrdersCreated++;

    // 2) Sent PO (awaiting receipt).
    await this.createPurchaseOrderService.execute(
      tenantId,
      storeId,
      {
        supplierId: suppliers[1].id,
        orderDate: daysAgo(6),
        expectedDate: daysAgo(-3),
        status: 'SENT',
        lines: pickLines(2, 3),
      },
      actor,
    );
    purchaseOrdersCreated++;

    // 3) Partially received PO + bill for the received portion.
    const partialPo = await this.createPurchaseOrderService.execute(
      tenantId,
      storeId,
      {
        supplierId: suppliers[2].id,
        orderDate: daysAgo(12),
        expectedDate: daysAgo(-1),
        status: 'SENT',
        lines: pickLines(1, 3),
      },
      actor,
    );
    purchaseOrdersCreated++;
    await this.receivePurchaseOrderService.execute(
      tenantId,
      storeId,
      partialPo.id,
      {
        lines: partialPo.lines
          .slice(0, 2)
          .map((l) => ({ lineId: l.id, receivedQuantity: Math.ceil(l.quantity / 2) })),
        receivedDate: daysAgo(4),
      },
      actor,
    );

    // 4) Fully received PO + bill + partial payment.
    const fullPo = await this.createPurchaseOrderService.execute(
      tenantId,
      storeId,
      {
        supplierId: suppliers[3].id,
        orderDate: daysAgo(20),
        expectedDate: daysAgo(-10),
        status: 'SENT',
        lines: pickLines(3, 2),
      },
      actor,
    );
    purchaseOrdersCreated++;
    await this.receivePurchaseOrderService.execute(
      tenantId,
      storeId,
      fullPo.id,
      {
        lines: fullPo.lines.map((l) => ({
          lineId: l.id,
          receivedQuantity: l.quantity,
        })),
        receivedDate: daysAgo(9),
      },
      actor,
    );
    const fullBill = await this.createBillService.execute(
      tenantId,
      storeId,
      {
        supplierId: suppliers[3].id,
        purchaseOrderId: fullPo.id,
        supplierInvoiceNo: 'INV-DEMO-0042',
        billDate: daysAgo(8),
        dueDate: daysAgo(-22),
        lines: fullPo.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitCost: Number(l.unitCost),
        })),
      },
      actor,
    );
    billsCreated++;

    // A standalone bill on another supplier, fully unpaid.
    await this.createBillService.execute(
      tenantId,
      storeId,
      {
        supplierId: suppliers[4].id,
        supplierInvoiceNo: 'INV-DEMO-0043',
        billDate: daysAgo(2),
        dueDate: daysAgo(-28),
        lines: pickLines(0, 3),
      },
      actor,
    );
    billsCreated++;

    // Partial payment against the fully-received bill.
    await this.recordSupplierPaymentService.execute(
      tenantId,
      storeId,
      {
        supplierId: suppliers[3].id,
        billId: fullBill.id,
        paymentDate: daysAgo(5),
        amount: Number((Number(fullBill.totalAmount) / 2).toFixed(2)),
        method: undefined,
      },
      actor,
    );
    paymentsCreated++;

    return {
      success: true,
      message: 'Purchase demo data seeded.',
      suppliersCreated: suppliers.length,
      purchaseOrdersCreated,
      billsCreated,
      paymentsCreated,
    };
  }
}
