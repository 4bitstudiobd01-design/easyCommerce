import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  AdjustStockDto,
  StockAdjustmentAction,
} from '../../inventory/dto/adjust-stock.dto';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import {
  PurchaseOrderEntity,
  PurchaseOrderStatusEnum,
} from '../entities/purchase-order.entity';
import { PurchaseOrderLineEntity } from '../entities/purchase-order-line.entity';
import { ReceivePurchaseOrderDto } from '../dto/purchase-order.dto';
import { fromCents, toCents } from './purchase-money.util';

/**
 * Receives goods against a purchase order. Each line's `receivedQuantity` grows by the
 * quantity received now; stock is pushed in through the inventory module's AdjustStockService
 * (an `IN` movement tagged referenceType PURCHASE_ORDER, referenceId = the PO id). The PO's
 * `receivedValue` and `status` are recomputed.
 *
 * Every line is validated up front; the stock adjustments each commit in their own
 * transaction, so a mid-batch inventory failure leaves a partial receipt that can simply be
 * re-run for the remaining lines.
 */
@Injectable()
export class ReceivePurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
    private readonly adjustStockService: AdjustStockService,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    id: string,
    dto: ReceivePurchaseOrderDto,
    userId: string,
  ): Promise<PurchaseOrderEntity> {
    const po = await this.purchaseOrderRepository.findOne({
      where: { id, storeId },
      relations: ['lines'],
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found in this store.');
    }
    if (
      po.status !== PurchaseOrderStatusEnum.SENT &&
      po.status !== PurchaseOrderStatusEnum.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        'Send the purchase order before receiving against it.',
      );
    }

    const lineById = new Map(po.lines.map((l) => [l.id, l]));
    const receipts: Array<{ line: PurchaseOrderLineEntity; qty: number }> = [];
    for (const row of dto.lines) {
      if (row.receivedQuantity <= 0) continue;
      const line = lineById.get(row.lineId);
      if (!line) {
        throw new BadRequestException('One or more lines do not belong to this purchase order.');
      }
      if (line.receivedQuantity + row.receivedQuantity > line.quantity) {
        throw new BadRequestException(
          `Cannot receive more than the ordered quantity for ${line.productName}.`,
        );
      }
      receipts.push({ line, qty: row.receivedQuantity });
    }
    if (receipts.length === 0) {
      throw new BadRequestException('Enter a quantity to receive for at least one line.');
    }

    for (const { line, qty } of receipts) {
      const adjustDto: AdjustStockDto = {
        productId: line.productId,
        variantId: line.variantId,
        warehouseId: dto.warehouseId,
        action: StockAdjustmentAction.ADD,
        quantity: qty,
        reason: `Purchase order ${po.poNumber} receipt`,
        reference: po.id,
        referenceType: 'PURCHASE_ORDER',
        notes: dto.notes?.trim(),
      };
      await this.adjustStockService.execute(tenantId, adjustDto, userId);
    }

    return this.dataSource.transaction(async (manager) => {
      const poRepo = manager.getRepository(PurchaseOrderEntity);
      const lineRepo = manager.getRepository(PurchaseOrderLineEntity);

      for (const { line, qty } of receipts) {
        line.receivedQuantity += qty;
        await lineRepo.save(line);
      }

      const fresh = (await poRepo.findOne({
        where: { id: po.id },
        relations: ['lines'],
      })) as PurchaseOrderEntity;

      let receivedValueCents = 0;
      let totalOrdered = 0;
      let totalReceived = 0;
      for (const line of fresh.lines) {
        receivedValueCents += toCents(line.unitCost) * line.receivedQuantity;
        totalOrdered += line.quantity;
        totalReceived += line.receivedQuantity;
      }

      fresh.receivedValue = fromCents(receivedValueCents);
      fresh.status =
        totalReceived >= totalOrdered
          ? PurchaseOrderStatusEnum.FULLY_RECEIVED
          : PurchaseOrderStatusEnum.PARTIALLY_RECEIVED;
      await poRepo.save(fresh);

      fresh.lines = [...fresh.lines].sort((a, b) => a.lineOrder - b.lineOrder);
      return fresh;
    });
  }
}
