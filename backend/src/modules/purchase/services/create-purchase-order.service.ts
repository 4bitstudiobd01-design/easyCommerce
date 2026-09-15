import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { ProductVariantEntity } from '../../catalog/entities/product-variant.entity';
import { SupplierEntity } from '../entities/supplier.entity';
import {
  PurchaseOrderEntity,
  PurchaseOrderPaymentStatusEnum,
  PurchaseOrderStatusEnum,
} from '../entities/purchase-order.entity';
import { PurchaseOrderLineEntity } from '../entities/purchase-order-line.entity';
import { PurchaseCounterKindEnum } from '../entities/purchase-counter.entity';
import { CreatePurchaseOrderDto } from '../dto/purchase-order.dto';
import { AllocatePurchaseNumberService } from './allocate-purchase-number.service';
import { fromCents, toCents } from './purchase-money.util';
import { FinanceRequisitionEntity } from '../../finance/entities/finance-requisition.entity';
import { FinanceRequisitionStatusEnum } from '../../finance/enums/finance.enums';

/**
 * Raises a purchase order on a supplier with product line items. Header totals are computed
 * from the lines; product / variant ids are validated against the catalog and their name /
 * sku snapshotted onto each line.
 */
@Injectable()
export class CreatePurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    private readonly allocatePurchaseNumberService: AllocatePurchaseNumberService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreatePurchaseOrderDto,
    userId: string,
  ): Promise<PurchaseOrderEntity> {
    const supplier = await this.supplierRepository.findOne({
      where: { id: dto.supplierId, storeId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found in this store.');
    }

    const productIds = [...new Set(dto.lines.map((l) => l.productId))];
    const products = await this.productRepository.find({
      where: { id: In(productIds), tenantId },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more selected products do not belong to this store catalog or do not exist.',
      );
    }
    const productById = new Map(products.map((p) => [p.id, p]));

    const variantIds = [
      ...new Set(dto.lines.map((l) => l.variantId).filter((v): v is string => !!v)),
    ];
    const variants = variantIds.length
      ? await this.variantRepository.find({ where: { id: In(variantIds), tenantId } })
      : [];
    if (variants.length !== variantIds.length) {
      throw new BadRequestException(
        'One or more selected product variants do not belong to this store or do not exist.',
      );
    }
    const variantById = new Map(variants.map((v) => [v.id, v]));

    let subtotalCents = 0;
    const lineRows = dto.lines.map((line, index) => {
      const product = productById.get(line.productId)!;
      const variant = line.variantId ? variantById.get(line.variantId) : undefined;
      if (variant && variant.productId !== product.id) {
        throw new BadRequestException(
          `Variant does not belong to product "${product.name}".`,
        );
      }
      const lineTotalCents = toCents(line.unitCost) * line.quantity;
      subtotalCents += lineTotalCents;
      return {
        storeId,
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        sku: variant?.sku ?? product.sku,
        quantity: line.quantity,
        receivedQuantity: 0,
        unitCost: toCents(line.unitCost) ? fromCents(toCents(line.unitCost)) : '0.00',
        lineTotal: fromCents(lineTotalCents),
        lineOrder: index,
      };
    });

    const poNumber = await this.allocatePurchaseNumberService.execute(
      tenantId,
      storeId,
      PurchaseCounterKindEnum.PO,
    );

    return this.dataSource.transaction(async (manager) => {
      const poRepo = manager.getRepository(PurchaseOrderEntity);
      const lineRepo = manager.getRepository(PurchaseOrderLineEntity);

      const po = await poRepo.save(
        poRepo.create({
          tenantId,
          storeId,
          poNumber,
          supplierId: supplier.id,
          supplierName: supplier.name,
          orderDate: dto.orderDate,
          expectedDate: dto.expectedDate,
          status:
            dto.status === 'DRAFT'
              ? PurchaseOrderStatusEnum.DRAFT
              : PurchaseOrderStatusEnum.PENDING_APPROVAL,
          paymentStatus: PurchaseOrderPaymentStatusEnum.PENDING,
          subtotal: fromCents(subtotalCents),
          totalAmount: fromCents(subtotalCents),
          receivedValue: '0.00',
          notes: dto.notes?.trim(),
          createdByUserId: userId,
        }),
      );

      await lineRepo.save(
        lineRows.map((row) => lineRepo.create({ ...row, purchaseOrderId: po.id })),
      );

      // If submitted for Finance approval (default for non-draft), create requisition
      if (po.status === PurchaseOrderStatusEnum.PENDING_APPROVAL) {
        const reqRepo = manager.getRepository(FinanceRequisitionEntity);
        const year = new Date().getFullYear();
        const reqCount = await reqRepo.count({ where: { storeId } });
        const reqNumber = `REQ-${year}-${String(reqCount + 1).padStart(4, '0')}`;

        await reqRepo.save(
          reqRepo.create({
            tenantId,
            storeId,
            requisitionNumber: reqNumber,
            title: `PO ${poNumber}: Restock from ${supplier.name}`,
            category: 'PURCHASE',
            purchaseOrderId: po.id,
            poNumber: po.poNumber,
            supplierId: supplier.id,
            supplierName: supplier.name,
            requestedAmount: po.totalAmount,
            requestDate: po.orderDate,
            requiredDate: po.expectedDate,
            status: FinanceRequisitionStatusEnum.PENDING,
            notes: po.notes,
            items: lineRows.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.productName,
              sku: l.sku,
              quantity: l.quantity,
              unitCost: Number(l.unitCost),
              lineTotal: Number(l.lineTotal),
            })),
            createdByUserId: userId,
          }),
        );
      }

      return poRepo.findOne({
        where: { id: po.id },
        relations: ['lines'],
      }) as Promise<PurchaseOrderEntity>;
    });
  }
}
