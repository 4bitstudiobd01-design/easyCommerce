import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandEntity } from '../entities/brand.entity';

@Injectable()
export class ListBrandsService {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly brandRepository: Repository<BrandEntity>,
  ) {}

  async execute(tenantId: string): Promise<BrandEntity[]> {
    return this.brandRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }
}
