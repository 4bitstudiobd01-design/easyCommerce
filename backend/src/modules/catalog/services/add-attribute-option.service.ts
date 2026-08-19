import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';
import { AttributeOptionEntity } from '../entities/attribute-option.entity';

export interface AddAttributeOptionDto {
  label: string;
  value?: string;
  sortOrder?: number;
}

@Injectable()
export class AddAttributeOptionService {
  constructor(
    @InjectRepository(AttributeDefinitionEntity)
    private readonly attributeRepository: Repository<AttributeDefinitionEntity>,
    @InjectRepository(AttributeOptionEntity)
    private readonly optionRepository: Repository<AttributeOptionEntity>,
  ) {}

  async execute(
    attributeId: string,
    tenantId: string,
    dto: AddAttributeOptionDto,
  ): Promise<AttributeOptionEntity> {
    if (!dto.label || !dto.label.trim()) {
      throw new BadRequestException('Option label is required');
    }

    const attribute = await this.attributeRepository.findOne({
      where: { id: attributeId, tenantId },
      relations: ['options'],
    });

    if (!attribute) {
      throw new NotFoundException('Attribute definition not found');
    }

    const label = dto.label.trim();
    const value = (dto.value || label).trim().toLowerCase().replace(/\s+/g, '-');

    // Check if option value already exists for this attribute
    const existing = attribute.options?.find(
      (opt) => opt.value.toLowerCase() === value.toLowerCase() || opt.label.toLowerCase() === label.toLowerCase(),
    );

    if (existing) {
      return existing;
    }

    const nextSortOrder =
      dto.sortOrder !== undefined
        ? dto.sortOrder
        : (attribute.options?.length || 0) + 1;

    const newOption = this.optionRepository.create({
      label,
      value,
      sortOrder: nextSortOrder,
      attributeId: attribute.id,
      tenantId,
    });

    return this.optionRepository.save(newOption);
  }
}
