import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandEntity } from '../entities/brand.entity';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { ProductSlugService } from './product-slug.service';

@Injectable()
export class CreateBrandService {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly brandRepository: Repository<BrandEntity>,
    private readonly slugService: ProductSlugService,
  ) {}

  async execute(tenantId: string, dto: CreateBrandDto): Promise<BrandEntity> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Brand name is required');
    }

    const rawSlug = dto.slug || dto.name;
    const slug = await this.slugService.generateSlug(rawSlug, tenantId);

    const brand = this.brandRepository.create({
      name: dto.name.trim(),
      slug,
      description: dto.description ? dto.description.trim() : undefined,
      logoUrl: dto.logoUrl ? dto.logoUrl.trim() : undefined,
      tenantId,
    });

    return this.brandRepository.save(brand);
  }
}
