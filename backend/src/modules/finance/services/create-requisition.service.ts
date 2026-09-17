import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceRequisitionEntity } from '../entities/finance-requisition.entity';
import { CreateFinanceRequisitionDto } from '../dto/finance-requisition.dto';
import {
  FinanceRequisitionStatusEnum,
  FinanceRequisitionPriorityEnum,
} from '../enums/finance.enums';

@Injectable()
export class CreateRequisitionService {
  constructor(
    @InjectRepository(FinanceRequisitionEntity)
    private readonly requisitionRepo: Repository<FinanceRequisitionEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    userId: string,
    userName: string | undefined,
    dto: CreateFinanceRequisitionDto,
  ): Promise<FinanceRequisitionEntity> {
    if (dto.requestedAmount <= 0) {
      throw new BadRequestException('Requested amount must be greater than 0.');
    }

    const year = new Date().getFullYear();
    const count = await this.requisitionRepo.count({ where: { storeId } });
    const requisitionNumber = `REQ-${year}-${String(count + 1).padStart(4, '0')}`;

    const entity = this.requisitionRepo.create({
      tenantId,
      storeId,
      requisitionNumber,
      title: dto.title.trim(),
      category: dto.category || 'PURCHASE',
      purchaseOrderId: dto.purchaseOrderId,
      poNumber: dto.poNumber,
      supplierId: dto.supplierId,
      supplierName: dto.supplierName,
      requestedAmount: String(dto.requestedAmount),
      requestDate: dto.requestDate || new Date().toISOString().split('T')[0],
      requiredDate: dto.requiredDate,
      status: FinanceRequisitionStatusEnum.PENDING,
      priority: dto.priority || FinanceRequisitionPriorityEnum.NORMAL,
      notes: dto.notes?.trim(),
      items: dto.items || [],
      createdByUserId: userId,
      createdByName: userName,
    });

    return this.requisitionRepo.save(entity);
  }
}
