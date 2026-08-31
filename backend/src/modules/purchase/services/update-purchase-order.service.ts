import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { SupplierEntity } from '../entities/supplier.entity';
import {
  PurchaseOrderEntity,
  PurchaseOrderStatusEnum,
} from '../entities/purchase-order.entity';
import { PurchaseOrderLineEntity } from '../entities/purchase-order-line.entity';
import { UpdatePurchaseOrderDto } from '../dto/purchase-order.dto';
import { fromCents, toCents } from './purchase-money.util';

/**
 * Edits a purchase order while it is still DRAFT or SENT and nothing has been received.
 * When `lines` is supplied it fully replaces the existing lines and header totals are
 * recomputed.
 */
@Injectable()
export class UpdatePurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    id: string,
    dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrderEntity> {
    const po = await this.purchaseOrderRepository.findOne({
      where: { id, storeId },
      relations: ['lines'],
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found in this store.');
    }
    if (
      po.status !== PurchaseOrderStatusEnum.DRAFT &&
      po.status !== PurchaseOrderStatusEnum.SENT
    ) {
      throw new BadRequestException(
        'A purchase order cannot be edited once items have been received or it is cancelled.',
      );
    }
    if (po.lines.some((l) => l.receivedQuantity > 0)) {
      throw new BadRequestException(
        'A purchase order cannot be edited once items have been received.',
      );
    }

    if (dto.supplierId && dto.supplierId !== po.supplierId) {
      const supplier = await this.supplierRepository.findOne({
        where: { id: dto.supplierId, storeId },
      });
      if (!supplier) {
        throw new NotFoundException('Supplier not found in this store.');
      }
      po.supplierId = supplier.id;
      po.supplierName = supplier.name;
    }
    if (dto.orderDate !== undefined) po.orderDate = dto.orderDate;
    if (dto.expectedDate !== undefined) po.expectedDate = dto.expectedDate;
    if (dto.notes !== undefined) po.notes = dto.notes.trim();
    if (dto.status !== undefined) {
      po.status =
        dto.status === 'SENT'
          ? PurchaseOrderStatusEnum.SENT
          : PurchaseOrderStatusEnum.DRAFT;
    }

    let newLineRows: Array<Partial<PurchaseOrderLineEntity>> | undefined;
    if (dto.lines) {
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
      newLineRows = dto.lines.map((line, index) => {
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
        return {
          storeId,
          purchaseOrderId: po.id,
          productId: product.id,
          variantId: variant?.id,
          productName: product.name,
          sku: variant?.sku ?? product.sku,
          quantity: line.quantity,
          receivedQuantity: 0,
          unitCost: fromCents(unitCostCents),
          lineTotal: fromCents(lineTotalCents),
          lineOrder: index,
        };
      });
      po.subtotal = fromCents(subtotalCents);
      po.totalAmount = fromCents(subtotalCents);
    }

    return this.dataSource.transaction(async (manager) => {
      const poRepo = manager.getRepository(PurchaseOrderEntity);
      const lineRepo = manager.getRepository(PurchaseOrderLineEntity);

      if (newLineRows) {
        await lineRepo.delete({ purchaseOrderId: po.id });
        await lineRepo.save(newLineRows.map((row) => lineRepo.create(row)));
      }
      await poRepo.save(po);

      return poRepo.findOne({
        where: { id: po.id },
        relations: ['lines'],
      }) as Promise<PurchaseOrderEntity>;
    });
  }
}
