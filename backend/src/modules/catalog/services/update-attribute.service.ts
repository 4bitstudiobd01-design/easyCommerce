import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';
import { AttributeOptionEntity } from '../entities/attribute-option.entity';
import { AttributeType } from '../enums/attribute-type.enum';

export interface UpdateAttributeDto {
  name?: string;
  type?: AttributeType;
  description?: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  isVariantOption?: boolean;
  options?: { id?: string; label: string; value: string; sortOrder?: number }[];
}

@Injectable()
export class UpdateAttributeService {
  constructor(
    @InjectRepository(AttributeDefinitionEntity)
    private readonly attributeRepository: Repository<AttributeDefinitionEntity>,
    @InjectRepository(AttributeOptionEntity)
    private readonly optionRepository: Repository<AttributeOptionEntity>,
  ) {}

  async execute(attributeId: string, tenantId: string, dto: UpdateAttributeDto): Promise<AttributeDefinitionEntity> {
    const attribute = await this.attributeRepository.findOne({
      where: { id: attributeId, tenantId },
      relations: ['options'],
    });

    if (!attribute) {
      throw new NotFoundException('Attribute definition not found');
    }

    if (dto.name !== undefined && dto.name.trim()) {
      attribute.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      attribute.description = dto.description.trim() || undefined;
    }
    if (dto.type !== undefined) {
      attribute.type = dto.type;
    }
    if (dto.isRequired !== undefined) {
      attribute.isRequired = Boolean(dto.isRequired);
    }
    if (dto.isFilterable !== undefined) {
      attribute.isFilterable = Boolean(dto.isFilterable);
    }
    if (dto.isVariantOption !== undefined) {
      attribute.isVariantOption = Boolean(dto.isVariantOption);
    }

    const saved = await this.attributeRepository.save(attribute);

    // If options are provided, update/insert them
    if (dto.options && Array.isArray(dto.options)) {
      // Remove old options not in the new list
      const existingOptionIds = attribute.options?.map((o) => o.id) || [];
      const newOptionIds = dto.options.filter((o) => o.id).map((o) => o.id as string);
      const toDelete = existingOptionIds.filter((id) => !newOptionIds.includes(id));

      if (toDelete.length > 0) {
        await this.optionRepository.delete(toDelete);
      }

      for (let i = 0; i < dto.options.length; i++) {
        const opt = dto.options[i];
        if (opt.id) {
          await this.optionRepository.update(
            { id: opt.id, attributeId: saved.id, tenantId },
            {
              label: opt.label.trim(),
              value: opt.value.trim().toLowerCase().replace(/\s+/g, '-'),
              sortOrder: opt.sortOrder !== undefined ? opt.sortOrder : i,
            },
          );
        } else {
          const newOpt = this.optionRepository.create({
            label: opt.label.trim(),
            value: (opt.value || opt.label).trim().toLowerCase().replace(/\s+/g, '-'),
            sortOrder: opt.sortOrder !== undefined ? opt.sortOrder : i,
            attributeId: saved.id,
            tenantId,
          });
          await this.optionRepository.save(newOpt);
        }
      }
    }

    return this.attributeRepository.findOne({
      where: { id: saved.id, tenantId },
      relations: ['options'],
    }) as Promise<AttributeDefinitionEntity>;
  }
}
