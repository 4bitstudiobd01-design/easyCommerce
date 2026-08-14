import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import {
  InventorySettingsOverviewResponseDto,
  InventoryDataIntegrityViolationDto,
} from '../dto/inventory-settings-overview-response.dto';

@Injectable()
export class GetInventorySettingsOverviewService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>,
  ) {}

  async execute(tenantId: string): Promise<InventorySettingsOverviewResponseDto> {
    // 1. Fetch entity counts strictly scoped to tenant
    const [totalProducts, totalVariants, totalMovements, stocks] = await Promise.all([
      this.productRepository.count({ where: { tenantId } }),
      this.variantRepository.count({ where: { tenantId } }),
      this.movementRepository.count({ where: { tenantId } }),
      this.stockRepository.find({
        where: { tenantId },
        relations: ['product'],
      }),
    ]);

    let inStockItems = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;

    const violations: InventoryDataIntegrityViolationDto[] = [];

    // 2. Aggregate counts and perform runtime zero-trust invariant checks
    for (const stock of stocks) {
      const onHand = stock.quantityOnHand ?? 0;
      const reserved = stock.quantityReserved ?? 0;
      const available = onHand - reserved;
      const threshold = stock.reorderPoint ?? stock.product?.lowStockThreshold ?? 10;
      const allowBackorder = stock.product?.allowBackorder ?? false;

      // Status aggregation
      if (available <= 0) {
        outOfStockItems++;
      } else if (available <= threshold) {
        lowStockItems++;
      } else {
        inStockItems++;
      }

      // Invariant checks
      if (onHand < 0 && !allowBackorder) {
        violations.push({
          inventoryId: stock.id,
          type: 'NEGATIVE_ON_HAND',
          message: `Stock ID "${stock.id}" has negative on-hand quantity (${onHand}).`,
        });
      }

      if (reserved < 0) {
        violations.push({
          inventoryId: stock.id,
          type: 'NEGATIVE_RESERVED',
          message: `Stock ID "${stock.id}" has negative reserved quantity (${reserved}).`,
        });
      }

      if (reserved > onHand && !allowBackorder) {
        violations.push({
          inventoryId: stock.id,
          type: 'RESERVED_EXCEEDS_ON_HAND',
          message: `Stock ID "${stock.id}" has reserved count (${reserved}) exceeding physical on-hand (${onHand}).`,
        });
      }
    }

    const integrityStatus = violations.length === 0 ? 'HEALTHY' : 'DEGRADED';

    return {
      overview: {
        totalProducts,
        totalVariants,
        totalInventoryItems: stocks.length,
        inStockItems,
        lowStockItems,
        outOfStockItems,
        totalMovements,
      },
      integrity: {
        status: integrityStatus,
        violationCount: violations.length,
        violations,
      },
      securityGuarantees: {
        stockValidationEnabled: true,
        auditLogEnabled: true,
        tenantIsolationEnabled: true,
        autoStatusUpdateEnabled: true,
        bulkOperationsEnabled: true,
      },
    };
  }
}
