import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttributeValueEntity } from '../entities/product-attribute-value.entity';

@Injectable()
export class ListProductAttributeValuesService {
  constructor(
    @InjectRepository(ProductAttributeValueEntity)
    private readonly valueRepository: Repository<ProductAttributeValueEntity>,
  ) {}

  async execute(productId: string, tenantId: string): Promise<ProductAttributeValueEntity[]> {
    return this.valueRepository.find({
      where: { productId, tenantId },
      relations: ['attribute', 'attribute.options'],
      order: { attribute: { sortOrder: 'ASC', name: 'ASC' } },
    });
  }
}
