import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxSlabEntity } from '../entities/tax-slab.entity';
import { ComputeTaxService, TaxComputationResult } from './compute-tax.service';
import { EstimateTaxQueryDto } from '../dto/tax.dto';

@Injectable()
export class EstimateTaxService {
  constructor(
    @InjectRepository(TaxSlabEntity)
    private readonly taxSlabRepository: Repository<TaxSlabEntity>,
    private readonly computeTaxService: ComputeTaxService,
  ) {}

  async execute(storeId: string, query: EstimateTaxQueryDto): Promise<TaxComputationResult> {
    const slabs = await this.taxSlabRepository.find({
      where: { storeId, fiscalYear: query.fiscalYear },
      order: { sortOrder: 'ASC' },
    });

    return this.computeTaxService.computeAnnualTax(slabs, Number(query.annualIncome));
  }
}
