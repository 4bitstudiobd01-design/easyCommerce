import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { MovementType } from '../enums/inventory-movement-type.enum';
import { ProductStatus } from '../../catalog/enums/product-status.enum';
import { ProductType } from '../../catalog/enums/product-type.enum';
import { SeedInventoryDemoDataResponseDto } from '../dto/seed-inventory-demo-data-response.dto';

interface SeedDemoProductDef {
  title: string;
  slug: string;
  sku: string;
  price: number;
  lowStockThreshold: number;
  variants?: Array<{
    title: string;
    sku: string;
    price: number;
    stock: number;
    reserved: number;
  }>;
  stock?: number;
  reserved?: number;
}

const DEMO_PRODUCTS: SeedDemoProductDef[] = [
  {
    title: 'MacBook Pro 16" M3 Max',
    slug: 'demo-macbook-pro-16-m3-max',
    sku: 'MBP16-M3M-001',
    price: 3499,
    lowStockThreshold: 10,
    variants: [
      { title: '36GB / 1TB Space Black', sku: 'MBP16-36-1TB-SB', price: 3499, stock: 42, reserved: 3 },
      { title: '48GB / 1TB Silver', sku: 'MBP16-48-1TB-SL', price: 3999, stock: 8, reserved: 1 }, // Low stock
      { title: '128GB / 8TB Space Black', sku: 'MBP16-128-8TB-SB', price: 7199, stock: 0, reserved: 0 }, // Out of stock
    ],
  },
  {
    title: 'Sony WH-1000XM5 Wireless Headphones',
    slug: 'demo-sony-wh-1000xm5-wireless',
    sku: 'SONY-XM5-001',
    price: 399,
    lowStockThreshold: 15,
    variants: [
      { title: 'Midnight Black', sku: 'SONY-XM5-BLK', price: 399, stock: 65, reserved: 4 },
      { title: 'Silver Cream', sku: 'SONY-XM5-SLV', price: 399, stock: 12, reserved: 2 }, // Low stock
      { title: 'Midnight Blue', sku: 'SONY-XM5-BLU', price: 399, stock: 2, reserved: 2 }, // Out of stock (0 available)
    ],
  },
  {
    title: 'Urban Heavyweight Fleece Hoodie',
    slug: 'demo-urban-heavyweight-fleece-hoodie',
    sku: 'URBAN-HD-001',
    price: 89,
    lowStockThreshold: 12,
    variants: [
      { title: 'Vintage Black / M', sku: 'URBAN-HD-BLK-M', price: 89, stock: 55, reserved: 2 },
      { title: 'Vintage Black / L', sku: 'URBAN-HD-BLK-L', price: 89, stock: 38, reserved: 1 },
      { title: 'Forest Green / M', sku: 'URBAN-HD-GRN-M', price: 89, stock: 7, reserved: 0 }, // Low stock
      { title: 'Washed Oat / XL', sku: 'URBAN-HD-OAT-XL', price: 89, stock: 0, reserved: 0 }, // Out of stock
    ],
  },
  {
    title: 'Artisan Espresso Machine Pro',
    slug: 'demo-artisan-espresso-machine-pro',
    sku: 'ART-ESP-900',
    price: 899,
    lowStockThreshold: 8,
    stock: 24,
    reserved: 2, // In stock
  },
  {
    title: 'Organic Single-Origin Coffee Beans (1kg)',
    slug: 'demo-organic-single-origin-coffee-beans',
    sku: 'COF-ETH-1KG',
    price: 34,
    lowStockThreshold: 20,
    stock: 15,
    reserved: 1, // Low stock (14 available <= 20)
  },
  {
    title: 'Ergonomic Minimalist LED Desk Lamp',
    slug: 'demo-ergonomic-minimalist-led-desk-lamp',
    sku: 'DESK-LMP-001',
    price: 129,
    lowStockThreshold: 10,
    stock: 0,
    reserved: 0, // Out of stock
  },
];

@Injectable()
export class SeedInventoryDemoDataService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>,
  ) {}

  async execute(tenantId: string, actorUserId?: string): Promise<SeedInventoryDemoDataResponseDto> {
    // 1. Production safety guard
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Demo inventory seeder is strictly disabled in production environments.');
    }

    return await this.dataSource.transaction(async (manager) => {
      // 2. Ensure default warehouse exists for tenant
      let warehouse = await manager.findOne(WarehouseEntity, {
        where: { tenantId, isDefault: true },
      });

      if (!warehouse) {
        warehouse = await manager.findOne(WarehouseEntity, {
          where: { tenantId },
        });
      }

      if (!warehouse) {
        warehouse = manager.create(WarehouseEntity, {
          name: 'Main Central Warehouse',
          code: 'MAIN-WH-01',
          isDefault: true,
          isActive: true,
          tenantId,
        });
        warehouse = await manager.save(WarehouseEntity, warehouse);
      }

      let productsCreated = 0;
      let variantsCreated = 0;
      let inventoryStocksCreated = 0;
      let movementsCreated = 0;

      for (const pDef of DEMO_PRODUCTS) {
        // Find or create product
        let product = await manager.findOne(ProductEntity, {
          where: { slug: pDef.slug, tenantId },
        });

        if (!product) {
          product = manager.create(ProductEntity, {
            name: pDef.title,
            slug: pDef.slug,
            sku: pDef.sku,
            basePrice: pDef.price,
            productType: ProductType.PHYSICAL,
            status: ProductStatus.ACTIVE,
            isPublished: true,
            trackInventory: true,
            lowStockThreshold: pDef.lowStockThreshold,
            hasVariants: Boolean(pDef.variants && pDef.variants.length > 0),
            tenantId,
          });
          product = await manager.save(ProductEntity, product);
          productsCreated++;
        }

        if (pDef.variants && pDef.variants.length > 0) {
          // Multi-variant product
          for (const vDef of pDef.variants) {
            let variant = await manager.findOne(ProductVariantEntity, {
              where: { sku: vDef.sku, tenantId },
            });

            if (!variant) {
              variant = manager.create(ProductVariantEntity, {
                productId: product.id,
                title: vDef.title,
                sku: vDef.sku,
                price: vDef.price,
                isEnabled: true,
                tenantId,
              });
              variant = await manager.save(ProductVariantEntity, variant);
              variantsCreated++;
            }

            // Create or update inventory stock
            let stock = await manager.findOne(InventoryStockEntity, {
              where: { productId: product.id, variantId: variant.id, tenantId },
            });

            if (!stock) {
              stock = manager.create(InventoryStockEntity, {
                productId: product.id,
                variantId: variant.id,
                warehouseId: warehouse.id,
                quantityOnHand: vDef.stock,
                quantityReserved: vDef.reserved,
                reorderPoint: pDef.lowStockThreshold,
                tenantId,
              });
              stock = await manager.save(InventoryStockEntity, stock);
              inventoryStocksCreated++;

              // Seed initial movement record (0 -> stock)
              const m1 = manager.create(InventoryMovementEntity, {
                productId: product.id,
                variantId: variant.id,
                inventoryStockId: stock.id,
                type: MovementType.INITIAL_STOCK,
                quantity: vDef.stock,
                previousQuantity: 0,
                newQuantity: vDef.stock,
                reason: 'Initial Opening Stock Setup',
                note: 'Deterministic demo seed initialization',
                createdBy: actorUserId || 'SYSTEM_DEMO_SEEDER',
                tenantId,
                createdAt: new Date(Date.now() - 86400000 * 7), // 7 days ago
              });
              await manager.save(InventoryMovementEntity, m1);
              movementsCreated++;

              // If stock > 10, add a secondary restock movement for rich history
              if (vDef.stock > 10) {
                const m2 = manager.create(InventoryMovementEntity, {
                  productId: product.id,
                  variantId: variant.id,
                  inventoryStockId: stock.id,
                  type: MovementType.IN,
                  quantity: 10,
                  previousQuantity: vDef.stock - 10,
                  newQuantity: vDef.stock,
                  reason: 'Purchase Order Restock Receipt',
                  referenceType: 'PURCHASE_ORDER',
                  referenceId: 'PO-DEMO-2026-08',
                  createdBy: actorUserId || 'SYSTEM_DEMO_SEEDER',
                  tenantId,
                  createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
                });
                await manager.save(InventoryMovementEntity, m2);
                movementsCreated++;
              }
            }
          }
        } else {
          // Simple non-variant product
          let defaultVariant = await manager.findOne(ProductVariantEntity, {
            where: { productId: product.id, tenantId },
          });

          if (!defaultVariant) {
            defaultVariant = manager.create(ProductVariantEntity, {
              productId: product.id,
              title: 'Default Variant',
              sku: pDef.sku,
              price: pDef.price,
              isEnabled: true,
              tenantId,
            });
            defaultVariant = await manager.save(ProductVariantEntity, defaultVariant);
            variantsCreated++;
          }

          let stock = await manager.findOne(InventoryStockEntity, {
            where: { productId: product.id, variantId: defaultVariant.id, tenantId },
          });

          if (!stock) {
            stock = manager.create(InventoryStockEntity, {
              productId: product.id,
              variantId: defaultVariant.id,
              warehouseId: warehouse.id,
              quantityOnHand: pDef.stock || 0,
              quantityReserved: pDef.reserved || 0,
              reorderPoint: pDef.lowStockThreshold,
              tenantId,
            });
            stock = await manager.save(InventoryStockEntity, stock);
            inventoryStocksCreated++;

            const m1 = manager.create(InventoryMovementEntity, {
              productId: product.id,
              variantId: defaultVariant.id,
              inventoryStockId: stock.id,
              type: MovementType.INITIAL_STOCK,
              quantity: pDef.stock || 0,
              previousQuantity: 0,
              newQuantity: pDef.stock || 0,
              reason: 'Opening Physical Inventory',
              createdBy: actorUserId || 'SYSTEM_DEMO_SEEDER',
              tenantId,
              createdAt: new Date(Date.now() - 86400000 * 5),
            });
            await manager.save(InventoryMovementEntity, m1);
            movementsCreated++;
          }
        }
      }

      return {
        success: true,
        message: 'Successfully seeded realistic inventory demo records.',
        productsCreated,
        variantsCreated,
        inventoryStocksCreated,
        movementsCreated,
      };
    });
  }
}
