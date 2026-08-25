import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ReorderProductsDto } from '../dto/reorder-products.dto';

@Injectable()
export class ReorderProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async execute(tenantId: string, dto: ReorderProductsDto): Promise<void> {
    const existing = await this.productRepository.find({
      where: { tenantId, id: In(dto.productIds) },
    });
    const existingIds = new Set(existing.map((p) => p.id));

    for (const id of dto.productIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Product ${id} does not belong to this tenant`);
      }
    }

    for (let index = 0; index < dto.productIds.length; index++) {
      await this.productRepository.update({ id: dto.productIds[index], tenantId }, { sortOrder: index });
    }
  }
}
