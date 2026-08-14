import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';
import { ListInventoryHistoryQueryDto } from '../dto/list-inventory-history-query.dto';
import {
  InventoryHistoryResponseDto,
  InventoryHistoryItemDto,
} from '../dto/inventory-history-response.dto';

@Injectable()
export class ListInventoryHistoryService {
  constructor(
    @InjectRepository(InventoryMovementEntity)
    private readonly movementRepository: Repository<InventoryMovementEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
  ) {}

  async execute(
    tenantId: string,
    query: ListInventoryHistoryQueryDto,
    inventoryIdOverride?: string,
  ): Promise<InventoryHistoryResponseDto> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const targetInventoryId = inventoryIdOverride || query.inventoryId;

    // Verify tenant ownership of specific inventory stock if requested
    if (targetInventoryId) {
      const stock = await this.stockRepository.findOne({
        where: { id: targetInventoryId, tenantId },
      });
      if (!stock) {
        throw new NotFoundException(`Inventory record with ID "${targetInventoryId}" not found or access denied.`);
      }
    }

    const qb = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('product.images', 'productImage')
      .leftJoinAndSelect('movement.variant', 'variant')
      .where('movement.tenantId = :tenantId', { tenantId });

    if (targetInventoryId) {
      qb.andWhere('movement.inventoryStockId = :targetInventoryId', { targetInventoryId });
    }

    if (query.productId) {
      qb.andWhere('movement.productId = :productId', { productId: query.productId });
    }

    if (query.variantId) {
      qb.andWhere('movement.variantId = :variantId', { variantId: query.variantId });
    }

    if (query.type) {
      qb.andWhere('movement.type = :type', { type: query.type });
    }

    if (query.reason && query.reason.trim() !== '') {
      qb.andWhere('LOWER(movement.reason) LIKE LOWER(:reason)', {
        reason: `%${query.reason.trim()}%`,
      });
    }

    if (query.performedBy && query.performedBy.trim() !== '') {
      qb.andWhere('movement.createdBy = :performedBy', {
        performedBy: query.performedBy.trim(),
      });
    }

    if (query.dateFrom) {
      const fromDate = new Date(query.dateFrom);
      if (!isNaN(fromDate.getTime())) {
        fromDate.setHours(0, 0, 0, 0);
        qb.andWhere('movement.createdAt >= :fromDate', { fromDate });
      }
    }

    if (query.dateTo) {
      const toDate = new Date(query.dateTo);
      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        qb.andWhere('movement.createdAt <= :toDate', { toDate });
      }
    }

    if (query.search && query.search.trim() !== '') {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(movement.referenceId) LIKE :term OR LOWER(movement.reason) LIKE :term OR LOWER(movement.note) LIKE :term)',
        { term },
      );
    }

    // Sorting
    const sortFieldMap: Record<string, string> = {
      createdAt: 'movement.createdAt',
      quantity: 'movement.quantity',
      previousQuantity: 'movement.previousQuantity',
      newQuantity: 'movement.newQuantity',
      type: 'movement.type',
    };

    const sortColumn = sortFieldMap[query.sortBy || 'createdAt'] || 'movement.createdAt';
    const sortDirection = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(sortColumn, sortDirection);

    // Pagination
    qb.skip((page - 1) * limit).take(limit);

    const [movements, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    const data: InventoryHistoryItemDto[] = movements.map((m) => {
      let productThumbnail: string | undefined = undefined;
      if (m.product && Array.isArray(m.product.images) && m.product.images.length > 0) {
        const sortedImages = [...m.product.images].sort(
          (a, b) =>
            Number(b.isPrimary) - Number(a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        );
        productThumbnail = sortedImages[0]?.url;
      }

      return {
        id: m.id,
        inventoryStockId: m.inventoryStockId,
        productId: m.productId,
        product: {
          id: m.productId,
          name: m.product?.name || 'Unknown Product',
          slug: m.product?.slug || '',
          thumbnail: productThumbnail,
          sku: m.product?.sku || undefined,
        },
        variant: m.variant
          ? {
              id: m.variant.id,
              title: m.variant.title,
              sku: m.variant.sku || undefined,
            }
          : undefined,
        type: m.type,
        quantityDelta: m.quantity,
        quantityBefore: m.previousQuantity,
        quantityAfter: m.newQuantity,
        reason: m.reason,
        referenceType: m.referenceType || undefined,
        referenceId: m.referenceId || undefined,
        note: m.note || undefined,
        performedBy: m.createdBy || undefined,
        createdAt: m.createdAt,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
