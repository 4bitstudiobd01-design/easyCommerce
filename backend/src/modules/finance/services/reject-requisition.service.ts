import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FinanceRequisitionEntity } from '../entities/finance-requisition.entity';
import { PurchaseOrderEntity, PurchaseOrderStatusEnum } from '../../purchase/entities/purchase-order.entity';
import { RejectFinanceRequisitionDto } from '../dto/finance-requisition.dto';
import { FinanceRequisitionStatusEnum } from '../enums/finance.enums';

@Injectable()
export class RejectRequisitionService {
  constructor(private readonly dataSource: DataSource) {}

  async execute(
    storeId: string,
    requisitionId: string,
    dto: RejectFinanceRequisitionDto,
  ): Promise<FinanceRequisitionEntity> {
    if (!dto.reason?.trim()) {
      throw new BadRequestException('A rejection reason is required.');
    }

    return this.dataSource.transaction(async (manager) => {
      const reqRepo = manager.getRepository(FinanceRequisitionEntity);
      const poRepo = manager.getRepository(PurchaseOrderEntity);

      const requisition = await reqRepo.findOne({
        where: { id: requisitionId, storeId },
      });

      if (!requisition) {
        throw new NotFoundException('Requisition not found.');
      }

      if (requisition.status === FinanceRequisitionStatusEnum.APPROVED) {
        throw new BadRequestException('Cannot reject an already approved requisition.');
      }

      requisition.status = FinanceRequisitionStatusEnum.REJECTED;
      requisition.rejectionReason = dto.reason.trim();

      const saved = await reqRepo.save(requisition);

      if (requisition.purchaseOrderId) {
        const po = await poRepo.findOne({
          where: { id: requisition.purchaseOrderId, storeId },
        });

        if (po) {
          po.status = PurchaseOrderStatusEnum.CANCELLED;
          po.notes = (
            (po.notes || '') +
            `\n[Finance Rejection Reason]: ${dto.reason.trim()}`
          ).trim();
          await poRepo.save(po);
        }
      }

      return saved;
    });
  }
}
