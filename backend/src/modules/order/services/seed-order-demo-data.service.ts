import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrderEntity, OrderStatusEnum, PaymentMethodEnum } from '../entities/order.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../../inventory/entities/inventory-movement.entity';
import { WarehouseEntity } from '../../inventory/entities/warehouse.entity';
import { MovementType } from '../../inventory/enums/inventory-movement-type.enum';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { CreateManualOrderService } from './create-manual-order.service';
import { UpdateOrderStatusService } from './update-order-status.service';
import { CreateManualOrderDto } from '../dto/create-manual-order.dto';

export interface SeedOrderDemoResult {
  success: boolean;
  message: string;
  ordersCreated: number;
}

const DEMO_CUSTOMERS = [
  { name: 'Ayesha Siddika', phone: '+8801712345678', email: 'ayesha@example.com', city: 'Dhaka', address: 'House 12, Road 5, Dhanmondi' },
  { name: 'Rakib Hasan', phone: '+8801811223344', email: 'rakib@example.com', city: 'Dhaka', address: 'Flat B3, Green Road' },
  { name: 'Sumaiya Akter', phone: '+8801911556677', email: 'sumaiya@example.com', city: 'Chittagong', address: 'Agrabad C/A' },
  { name: 'Tanvir Ahmed', phone: '+8801611889900', email: 'tanvir@example.com', city: 'Sylhet', address: 'Zindabazar' },
  { name: 'Nadia Islam', phone: '+8801511101010', email: 'nadia@example.com', city: 'Khulna', address: 'Sonadanga R/A' },
  { name: 'Farhan Kabir', phone: '+8801722334455', email: 'farhan@example.com', city: 'Rajshahi', address: 'Shaheb Bazar' },
  { name: 'Mitu Rahman', phone: '+8801833445566', email: 'mitu@example.com', city: 'Dhaka', address: 'Mirpur DOHS' },
  { name: 'Sabbir Alam', phone: '+8801944556677', email: 'sabbir@example.com', city: 'Barishal', address: 'Sadar Road' },
];

// Statuses each demo order is advanced to, so the list, KPIs and status filters
// all have something to show.
const DEMO_STATUS_FLOW: OrderStatusEnum[] = [
  OrderStatusEnum.PENDING,
  OrderStatusEnum.CONFIRMED,
  OrderStatusEnum.PROCESSING,
  OrderStatusEnum.SHIPPED,
  OrderStatusEnum.DELIVERED,
  OrderStatusEnum.DELIVERED,
  OrderStatusEnum.CANCELLED,
  OrderStatusEnum.PENDING,
];

const DEMO_PAYMENT_METHODS = [
  PaymentMethodEnum.COD,
  PaymentMethodEnum.BKASH,
  PaymentMethodEnum.COD,
  PaymentMethodEnum.NAGAD,
];

// A catalog line the seeder knows it can actually sell — resolved from live
// inventory so CreateManualOrderService's stock check never fails the seed.
interface SellableUnit {
  productId: string;
  variantId?: string;
  available: number;
}

/**
 * Seeds demo customer orders so the Orders dashboard shows data immediately in
 * dev. Idempotent — if the store already has orders it does nothing. Runs the
 * real CreateManualOrderService / UpdateOrderStatusService so order numbering,
 * stock reservation, totals and status history are all exercised. Line items are
 * picked only from products/variants that currently have available stock, so the
 * seed cannot fail on an out-of-stock item.
 */
@Injectable()
export class SeedOrderDemoDataService {
  private readonly logger = new Logger(SeedOrderDemoDataService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    private readonly createManualOrderService: CreateManualOrderService,
    private readonly updateOrderStatusService: UpdateOrderStatusService,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    store: StoreEntity,
  ): Promise<SeedOrderDemoResult> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'The order demo seeder is disabled in production environments.',
      );
    }

    const existing = await this.orderRepository.count({ where: { tenantId } });
    if (existing > 0) {
      return {
        success: true,
        message: 'Order demo data already present — nothing seeded.',
        ordersCreated: 0,
      };
    }

    let sellable = await this.resolveSellableUnits(tenantId);
    if (sellable.length === 0) {
      // Nothing in stock — provision a demo opening balance so the seed can run.
      await this.provisionDemoStock(tenantId);
      sellable = await this.resolveSellableUnits(tenantId);
    }
    if (sellable.length === 0) {
      return {
        success: false,
        message:
          'No catalog products found — add products before seeding orders.',
        ordersCreated: 0,
      };
    }

    // Mutable copy of remaining stock so successive demo orders don't oversell a
    // low-stock line and trip CreateManualOrderService's guard.
    const remaining = new Map(sellable.map((s) => [this.key(s), s.available]));

    let ordersCreated = 0;

    for (let i = 0; i < DEMO_CUSTOMERS.length; i++) {
      const customer = DEMO_CUSTOMERS[i];
      const lineCount = 1 + (i % 3);

      const items: CreateManualOrderDto['items'] = [];
      for (let j = 0; j < lineCount; j++) {
        const unit = sellable[(i + j) % sellable.length];
        const key = this.key(unit);
        const left = remaining.get(key) ?? 0;
        if (left <= 0) continue;
        const quantity = Math.min(left, 1 + ((i + j) % 3));
        remaining.set(key, left - quantity);
        items.push({
          productId: unit.productId,
          variantId: unit.variantId,
          quantity,
          discountAmount: 0,
        });
      }

      if (items.length === 0) {
        // Everything the round-robin landed on is exhausted — nothing left to sell.
        break;
      }

      const dto: CreateManualOrderDto = {
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        shippingAddress: customer.address,
        city: customer.city,
        customerNote: 'Demo order — safe to delete.',
        paymentMethod: DEMO_PAYMENT_METHODS[i % DEMO_PAYMENT_METHODS.length],
        deliveryFee: 60,
        discountAmount: i % 4 === 0 ? 50 : 0,
        items,
      };

      try {
        const order = await this.createManualOrderService.execute(tenantId, userId, store, dto);
        ordersCreated++;

        const targetStatus = DEMO_STATUS_FLOW[i % DEMO_STATUS_FLOW.length];
        if (targetStatus !== OrderStatusEnum.PENDING) {
          await this.updateOrderStatusService.execute(order.id, tenantId, userId, {
            orderStatus: targetStatus,
            reason:
              targetStatus === OrderStatusEnum.CANCELLED
                ? 'Demo: customer cancelled.'
                : undefined,
          });
        }
      } catch (err) {
        this.logger.warn(
          `Skipped a demo order for ${customer.name}: ${(err as Error).message}`,
        );
      }
    }

    return {
      success: true,
      message:
        ordersCreated > 0
          ? 'Order demo data seeded.'
          : 'No demo orders could be created — check product stock.',
      ordersCreated,
    };
  }

  private key(u: { productId: string; variantId?: string }): string {
    return `${u.productId}::${u.variantId ?? ''}`;
  }

  /**
   * Dev convenience: when a store's products were created without any inventory
   * rows, give each orderable line a demo opening balance so the order seed has
   * something to sell. Simple products get a product-level row; variant products
   * get one row per enabled variant. Skips anything that already has a stock row.
   */
  private async provisionDemoStock(tenantId: string): Promise<void> {
    const products = await this.productRepository.find({
      where: { tenantId },
      take: 20,
      order: { createdAt: 'ASC' },
    });
    if (products.length === 0) return;

    const warehouseId = await this.resolveDefaultWarehouseId(tenantId);
    const OPENING_QTY = 50;

    for (const product of products) {
      if (product.trackInventory === false) continue;

      if (product.hasVariants) {
        const variants = await this.variantRepository.find({
          where: { productId: product.id, tenantId },
        });
        for (const variant of variants.filter((v) => v.isEnabled !== false)) {
          const exists = await this.stockRepository.findOne({
            where: { productId: product.id, variantId: variant.id, tenantId },
          });
          if (exists) continue;
          await this.writeOpeningStock(tenantId, warehouseId, product.id, variant.id, OPENING_QTY, product.lowStockThreshold);
        }
      } else {
        const exists = await this.stockRepository.findOne({
          where: { productId: product.id, variantId: undefined, tenantId },
        });
        if (exists) continue;
        await this.writeOpeningStock(tenantId, warehouseId, product.id, undefined, OPENING_QTY, product.lowStockThreshold);
      }
    }
  }

  private async writeOpeningStock(
    tenantId: string,
    warehouseId: string,
    productId: string,
    variantId: string | undefined,
    qty: number,
    reorderPoint?: number,
  ): Promise<void> {
    const stock = await this.stockRepository.save(
      this.stockRepository.create({
        productId,
        variantId,
        warehouseId,
        quantityOnHand: qty,
        quantityReserved: 0,
        reorderPoint: reorderPoint ?? 10,
        tenantId,
      }),
    );
    await this.movementRepository.save(
      this.movementRepository.create({
        productId,
        variantId,
        inventoryStockId: stock.id,
        type: MovementType.INITIAL_STOCK,
        quantity: qty,
        previousQuantity: 0,
        newQuantity: qty,
        reason: 'Demo opening stock (order seeder)',
        referenceType: 'SEED_ORDER_DEMO',
        tenantId,
      }),
    );
  }

  private async resolveDefaultWarehouseId(tenantId: string): Promise<string> {
    const existing = await this.warehouseRepository.findOne({
      where: { tenantId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
    if (existing) return existing.id;

    const created = await this.warehouseRepository.save(
      this.warehouseRepository.create({
        name: 'Main Store Warehouse',
        code: 'WH-MAIN',
        isDefault: true,
        address: 'Main Store Location',
        tenantId,
      }),
    );
    return created.id;
  }

  /**
   * Reads live inventory and returns the catalog lines that can actually be
   * ordered: for a variant product, each variant stock row with availability;
   * for a simple product, its product-level stock row.
   */
  private async resolveSellableUnits(tenantId: string): Promise<SellableUnit[]> {
    const stocks = await this.stockRepository.find({ where: { tenantId } });
    if (stocks.length === 0) return [];

    const productIds = Array.from(new Set(stocks.map((s) => s.productId)));
    const products = await this.productRepository.find({
      where: { id: In(productIds), tenantId },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    // Only enabled variants are orderable.
    const variantIds = stocks
      .map((s) => s.variantId)
      .filter((id): id is string => Boolean(id));
    const variants = variantIds.length
      ? await this.variantRepository.find({ where: { id: In(variantIds), tenantId } })
      : [];
    const enabledVariantIds = new Set(
      variants.filter((v) => v.isEnabled !== false).map((v) => v.id),
    );

    const units: SellableUnit[] = [];
    for (const stock of stocks) {
      const product = productById.get(stock.productId);
      if (!product || product.trackInventory === false) continue;

      const available =
        Number(stock.quantityOnHand ?? 0) - Number(stock.quantityReserved ?? 0);
      if (available <= 0) continue;

      if (stock.variantId) {
        if (!enabledVariantIds.has(stock.variantId)) continue;
        units.push({ productId: stock.productId, variantId: stock.variantId, available });
      } else {
        // A variant product's product-level row is a placeholder — its stock
        // lives on the variant rows, so skip it here.
        if (product.hasVariants) continue;
        units.push({ productId: stock.productId, available });
      }
    }

    return units;
  }
}
