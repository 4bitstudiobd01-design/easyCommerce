import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceRequisitionEntity } from '../entities/finance-requisition.entity';

@Injectable()
export class GetRequisitionService {
  constructor(
    @InjectRepository(FinanceRequisitionEntity)
    private readonly requisitionRepo: Repository<FinanceRequisitionEntity>,
  ) {}

  async execute(storeId: string, id: string): Promise<FinanceRequisitionEntity> {
    const requisition = await this.requisitionRepo.findOne({
      where: { id, storeId },
    });

    if (!requisition) {
      throw new NotFoundException('Requisition not found.');
    }

    return requisition;
  }
}
