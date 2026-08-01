import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsignmentEntity } from '../entities/consignment.entity';

@Injectable()
export class ListMerchantConsignmentsService {
  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
  ) {}

  async execute(tenantId: string): Promise<ConsignmentEntity[]> {
    return this.consignmentRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }
}
