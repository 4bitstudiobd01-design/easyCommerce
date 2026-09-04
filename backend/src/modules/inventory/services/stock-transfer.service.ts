import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTransferEntity } from '../entities/stock-transfer.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { BranchStockEntity } from '../entities/branch-stock.entity';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
// Read-only existence/tenant check on the Tenant module's entity — same
// approved cross-module repository-injection pattern used for Warehouse in
// Phase 2 of the Branch feature: no business logic crosses into the tenant
// module, only a tenant-scoped lookup via TypeORM's own repository.
import { BranchEntity } from '../../tenant/entities/branch.entity';

export type TransferLocation =
  | { type: 'WAREHOUSE'; id: string }
  | { type: 'BRANCH'; id: string };

export interface TransferStockInput {
  fromWarehouseId?: string;
  toWarehouseId?: string;
  fromBranchId?: string;
  toBranchId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  notes?: string;
}

@Injectable()
export class StockTransferService {
  constructor(
    @InjectRepository(StockTransferEntity)
    private readonly stockTransferRepository: Repository<StockTransferEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly inventoryStockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(BranchStockEntity)
    private readonly branchStockRepository: Repository<BranchStockEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly productVariantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
  ) {}

  private resolveLocation(warehouseId?: string, branchId?: string, side: 'source' | 'destination' = 'source'): TransferLocation {
    if (warehouseId && branchId) {
      throw new BadRequestException(
        `Specify either a warehouse or a branch for the ${side}, not both.`,
      );
    }
    if (warehouseId) return { type: 'WAREHOUSE', id: warehouseId };
    if (branchId) return { type: 'BRANCH', id: branchId };
    throw new BadRequestException(`A ${side} warehouse or branch is required.`);
  }

  private async assertLocationExists(tenantId: string, location: TransferLocation): Promise<void> {
    if (location.type === 'WAREHOUSE') {
      const warehouse = await this.warehouseRepository.findOne({ where: { id: location.id, tenantId } });
      if (!warehouse) {
        throw new NotFoundException(`Warehouse "${location.id}" not found.`);
      }
      return;
    }
    const branch = await this.branchRepository.findOne({ where: { id: location.id, tenantId } });
    if (!branch) {
      throw new NotFoundException(`Branch "${location.id}" not found.`);
    }
  }

  private async getStockRow(
    tenantId: string,
    productId: string,
    variantId: string | undefined,
    location: TransferLocation,
  ): Promise<InventoryStockEntity | BranchStockEntity | null> {
    if (location.type === 'WAREHOUSE') {
      return this.inventoryStockRepository.findOne({
        where: { warehouseId: location.id, productId, variantId: variantId ?? undefined, tenantId },
      });
    }
    return this.branchStockRepository.findOne({
      where: { branchId: location.id, productId, variantId: variantId ?? undefined, tenantId },
    });
  }

  private getOrCreateDestinationRow(
    tenantId: string,
    productId: string,
    variantId: string | undefined,
    location: TransferLocation,
    existing: InventoryStockEntity | BranchStockEntity | null,
  ): InventoryStockEntity | BranchStockEntity {
    if (existing) return existing;

    if (location.type === 'WAREHOUSE') {
      return this.inventoryStockRepository.create({
        warehouseId: location.id,
        productId,
        variantId,
        quantityOnHand: 0,
        quantityReserved: 0,
        reorderPoint: 5,
        tenantId,
      });
    }
    return this.branchStockRepository.create({
      branchId: location.id,
      productId,
      variantId,
      quantityOnHand: 0,
      quantityReserved: 0,
      reorderPoint: 5,
      tenantId,
    });
  }

  async transferStock(tenantId: string, dto: TransferStockInput): Promise<StockTransferEntity> {
    const source = this.resolveLocation(dto.fromWarehouseId, dto.fromBranchId, 'source');
    const destination = this.resolveLocation(dto.toWarehouseId, dto.toBranchId, 'destination');

    if (source.type === destination.type && source.id === destination.id) {
      throw new BadRequestException('Source and destination must be different.');
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException('Transfer quantity must be greater than zero.');
    }

    await this.assertLocationExists(tenantId, source);
    await this.assertLocationExists(tenantId, destination);

    const product = await this.productRepository.findOne({ where: { id: dto.productId, tenantId } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${dto.productId}" not found.`);
    }

    if (dto.variantId) {
      const variant = await this.productVariantRepository.findOne({
        where: { id: dto.variantId, productId: dto.productId },
      });
      if (!variant) {
        throw new NotFoundException(`Variant "${dto.variantId}" not found for this product.`);
      }
    }

    const sourceStock = await this.getStockRow(tenantId, dto.productId, dto.variantId, source);
    if (!sourceStock || sourceStock.quantityOnHand < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock at the source. Available: ${sourceStock ? sourceStock.quantityOnHand : 0}`,
      );
    }

    const existingDestStock = await this.getStockRow(tenantId, dto.productId, dto.variantId, destination);
    const destStock = this.getOrCreateDestinationRow(tenantId, dto.productId, dto.variantId, destination, existingDestStock);

    sourceStock.quantityOnHand -= dto.quantity;
    destStock.quantityOnHand += dto.quantity;

    return this.inventoryStockRepository.manager.transaction(async (manager) => {
      await manager.save(sourceStock);
      await manager.save(destStock);

      const transferLog = manager.create(StockTransferEntity, {
        fromWarehouseId: source.type === 'WAREHOUSE' ? source.id : undefined,
        fromBranchId: source.type === 'BRANCH' ? source.id : undefined,
        toWarehouseId: destination.type === 'WAREHOUSE' ? destination.id : undefined,
        toBranchId: destination.type === 'BRANCH' ? destination.id : undefined,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        notes: dto.notes,
        tenantId,
      });

      return manager.save(transferLog);
    });
  }

  async listStockTransfers(tenantId: string): Promise<StockTransferEntity[]> {
    return this.stockTransferRepository.find({
      where: { tenantId },
      relations: ['fromWarehouse', 'toWarehouse', 'product', 'variant'],
      order: { createdAt: 'DESC' },
    });
  }

  async listBranchStock(tenantId: string, branchId: string): Promise<BranchStockEntity[]> {
    return this.branchStockRepository.find({
      where: { tenantId, branchId },
      relations: ['product', 'variant'],
      order: { updatedAt: 'DESC' },
    });
  }

  /** Stock rows across every branch for the tenant — used by the branch cards to show a per-branch unit count, same as warehouse cards. */
  async listAllBranchesStock(tenantId: string): Promise<BranchStockEntity[]> {
    return this.branchStockRepository.find({
      where: { tenantId },
      order: { updatedAt: 'DESC' },
    });
  }
}
