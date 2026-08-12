import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnEntity, ReturnStatusEnum } from '../entities/return.entity';
import { ReturnItemEntity } from '../entities/return-item.entity';
import { UpdateReturnStatusDto } from '../dto/update-return-status.dto';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { StockAdjustmentAction } from '../../inventory/dto/adjust-stock.dto';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';
import { OrderStatusEnum } from '../entities/order.entity';

@Injectable()
export class UpdateReturnStatusService {
  constructor(
    @InjectRepository(ReturnEntity)
    private readonly returnRepository: Repository<ReturnEntity>,
    @InjectRepository(ReturnItemEntity)
    private readonly returnItemRepository: Repository<ReturnItemEntity>,
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly auditRepository: Repository<OrderStatusHistoryEntity>,
    private readonly adjustStockService: AdjustStockService,
  ) {}

  async execute(id: string, dto: UpdateReturnStatusDto, tenantId: string, actor: string = 'System'): Promise<ReturnEntity> {
    const returnRequest = await this.returnRepository.findOne({
      where: { id, tenantId },
      relations: ['items', 'items.orderItem'],
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    const currentStatus = returnRequest.status;
    const newStatus = dto.status;

    // Validate Status Transitions conceptually
    if (newStatus === ReturnStatusEnum.REJECTED && currentStatus !== ReturnStatusEnum.REQUESTED && currentStatus !== ReturnStatusEnum.INSPECTED) {
      throw new BadRequestException(`Cannot reject return from status ${currentStatus}`);
    }

    if (newStatus === ReturnStatusEnum.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    if (newStatus === ReturnStatusEnum.ACCEPTED && currentStatus !== ReturnStatusEnum.INSPECTED) {
      throw new BadRequestException('Return must be INSPECTED before it can be ACCEPTED');
    }

    if (newStatus === ReturnStatusEnum.INSPECTED && currentStatus !== ReturnStatusEnum.RECEIVED) {
      throw new BadRequestException('Return must be RECEIVED before it can be INSPECTED');
    }

    // Apply updates based on status
    returnRequest.status = newStatus;

    if (newStatus === ReturnStatusEnum.APPROVED) {
      returnRequest.approvedAt = new Date();
    } else if (newStatus === ReturnStatusEnum.REJECTED) {
      returnRequest.rejectionReason = dto.rejectionReason;
      returnRequest.completedAt = new Date();
    } else if (newStatus === ReturnStatusEnum.RECEIVED) {
      returnRequest.receivedAt = new Date();
    } else if (newStatus === ReturnStatusEnum.INSPECTED) {
      returnRequest.inspectedAt = new Date();
      // Update item conditions
      if (dto.condition) {
        for (const item of returnRequest.items) {
          item.condition = dto.condition;
          item.inspectionNote = dto.inspectionNote;
          await this.returnItemRepository.save(item);
        }
      }
    } else if (newStatus === ReturnStatusEnum.ACCEPTED) {
      returnRequest.completedAt = new Date();
      for (const item of returnRequest.items) {
        item.restockDecision = dto.restockDecision || false;
        await this.returnItemRepository.save(item);
        
        if (item.restockDecision && item.orderItem.productId) {
          await this.adjustStockService.execute(tenantId, {
            productId: item.orderItem.productId,
            quantity: item.quantity,
            action: StockAdjustmentAction.ADD,
          });
        }
      }
    } else if (newStatus === ReturnStatusEnum.CANCELLED) {
      returnRequest.completedAt = new Date();
    }

    const saved = await this.returnRepository.save(returnRequest);

    // Audit log
    await this.auditRepository.save(this.auditRepository.create({
      orderId: returnRequest.orderId,
      newStatus: OrderStatusEnum.RETURNED, // Abusing the history table slightly, could use a cleaner event system
      changedBy: actor,
      reason: `Return ${returnRequest.returnNumber} transitioned to ${newStatus}`,
      tenantId,
    }));

    return saved;
  }
}
