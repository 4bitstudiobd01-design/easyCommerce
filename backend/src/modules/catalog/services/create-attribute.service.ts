import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';
import { AttributeOptionEntity } from '../entities/attribute-option.entity';
import { CreateAttributeDto } from '../dto/create-attribute.dto';
import { ProductSlugService } from './product-slug.service';

@Injectable()
export class CreateAttributeService {
  constructor(
    @InjectRepository(AttributeDefinitionEntity)
    private readonly attributeRepository: Repository<AttributeDefinitionEntity>,
    @InjectRepository(AttributeOptionEntity)
    private readonly optionRepository: Repository<AttributeOptionEntity>,
    private readonly slugService: ProductSlugService,
  ) {}

  async execute(tenantId: string, dto: CreateAttributeDto): Promise<AttributeDefinitionEntity> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('Attribute name is required');
    }

    const key = (dto.key || dto.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const existingKey = await this.attributeRepository.findOne({
      where: { key, tenantId },
    });

    if (existingKey) {
      throw new BadRequestException(`Attribute key "${key}" already exists for your store.`);
    }

    const slug = await this.slugService.generateSlug(dto.name, tenantId);

    const attribute = this.attributeRepository.create({
      name: dto.name.trim(),
      slug,
      key,
      type: dto.type,
      description: dto.description ? dto.description.trim() : undefined,
      isRequired: Boolean(dto.isRequired),
      isFilterable: dto.isFilterable !== undefined ? Boolean(dto.isFilterable) : true,
      isVariantOption: Boolean(dto.isVariantOption),
      tenantId,
    });

    const savedAttribute = await this.attributeRepository.save(attribute);

    if (dto.options && dto.options.length > 0) {
      const optionsToSave = dto.options.map((opt, idx) =>
        this.optionRepository.create({
          label: opt.label.trim(),
          value: opt.value.trim().toLowerCase().replace(/\s+/g, '-'),
          sortOrder: opt.sortOrder !== undefined ? opt.sortOrder : idx,
          attributeId: savedAttribute.id,
          tenantId,
        }),
      );
      await this.optionRepository.save(optionsToSave);
    }

    return this.attributeRepository.findOne({
      where: { id: savedAttribute.id, tenantId },
      relations: ['options'],
    }) as Promise<AttributeDefinitionEntity>;
  }
}
