import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxSlabEntity } from '../entities/tax-slab.entity';

@Injectable()
export class GetTaxSlabsService {
  constructor(
    @InjectRepository(TaxSlabEntity)
    private readonly taxSlabRepository: Repository<TaxSlabEntity>,
  ) {}

  async execute(storeId: string, fiscalYear: string): Promise<TaxSlabEntity[]> {
    return this.taxSlabRepository.find({ where: { storeId, fiscalYear }, order: { sortOrder: 'ASC' } });
  }
}
