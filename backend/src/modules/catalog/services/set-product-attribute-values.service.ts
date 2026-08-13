import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';
import { ProductAttributeValueEntity } from '../entities/product-attribute-value.entity';
import { SetProductAttributeValuesDto, AttributeValueItemDto } from '../dto/set-product-attribute-values.dto';
import { AttributeType } from '../enums/attribute-type.enum';

@Injectable()
export class SetProductAttributeValuesService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(AttributeDefinitionEntity)
    private readonly attributeRepository: Repository<AttributeDefinitionEntity>,
    @InjectRepository(ProductAttributeValueEntity)
    private readonly valueRepository: Repository<ProductAttributeValueEntity>,
  ) {}

  async execute(
    productId: string,
    tenantId: string,
    dto: SetProductAttributeValuesDto,
  ): Promise<ProductAttributeValueEntity[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const attributeIds = dto.attributes.map((item) => item.attributeId);
    const definitions = await this.attributeRepository.find({
      where: { id: In(attributeIds), tenantId },
      relations: ['options'],
    });

    const definitionMap = new Map(definitions.map((def) => [def.id, def]));

    const valuesToSave: Partial<ProductAttributeValueEntity>[] = [];

    for (const item of dto.attributes) {
      const def = definitionMap.get(item.attributeId);
      if (!def) {
        throw new BadRequestException(`Attribute ID "${item.attributeId}" not found or does not belong to store.`);
      }

      const normalizedValue = this.validateAndNormalizeValue(def, item.value);

      valuesToSave.push({
        productId,
        attributeId: def.id,
        value: normalizedValue,
        tenantId,
      });
    }

    // Upsert product attribute values (remove existing and insert new)
    await this.valueRepository.delete({ productId, tenantId });

    const createdEntities = valuesToSave.map((val) => this.valueRepository.create(val));
    await this.valueRepository.save(createdEntities);

    return this.valueRepository.find({
      where: { productId, tenantId },
      relations: ['attribute', 'attribute.options'],
    });
  }

  private validateAndNormalizeValue(def: AttributeDefinitionEntity, rawValue: any): string {
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      if (def.isRequired) {
        throw new BadRequestException(`Attribute "${def.name}" is required.`);
      }
      return '';
    }

    switch (def.type) {
      case AttributeType.NUMBER: {
        const num = Number(rawValue);
        if (isNaN(num)) {
          throw new BadRequestException(`Value for "${def.name}" must be a valid number.`);
        }
        return String(num);
      }

      case AttributeType.BOOLEAN: {
        const boolVal = String(rawValue).toLowerCase() === 'true' || rawValue === true || rawValue === 1;
        return boolVal ? 'true' : 'false';
      }

      case AttributeType.SELECT: {
        const strVal = String(rawValue).trim();
        if (def.options && def.options.length > 0) {
          const matchedOption = def.options.find(
            (opt) => opt.value.toLowerCase() === strVal.toLowerCase() || opt.label.toLowerCase() === strVal.toLowerCase(),
          );
          if (!matchedOption) {
            throw new BadRequestException(`Invalid option "${strVal}" for attribute "${def.name}".`);
          }
          return matchedOption.label;
        }
        return strVal;
      }

      case AttributeType.MULTI_SELECT: {
        let arr: string[] = [];
        if (Array.isArray(rawValue)) {
          arr = rawValue.map((v) => String(v).trim());
        } else if (typeof rawValue === 'string') {
          try {
            arr = JSON.parse(rawValue);
          } catch {
            arr = rawValue.split(',').map((s) => s.trim());
          }
        }

        if (def.options && def.options.length > 0) {
          const validatedLabels: string[] = [];
          for (const val of arr) {
            const matchedOption = def.options.find(
              (opt) => opt.value.toLowerCase() === val.toLowerCase() || opt.label.toLowerCase() === val.toLowerCase(),
            );
            if (!matchedOption) {
              throw new BadRequestException(`Invalid option "${val}" for multi-select attribute "${def.name}".`);
            }
            validatedLabels.push(matchedOption.label);
          }
          return JSON.stringify(validatedLabels);
        }
        return JSON.stringify(arr);
      }

      case AttributeType.URL: {
        const strUrl = String(rawValue).trim();
        if (!/^https?:\/\//i.test(strUrl)) {
          throw new BadRequestException(`Value for "${def.name}" must be a valid http/https URL.`);
        }
        return strUrl;
      }

      case AttributeType.DATE: {
        const strDate = String(rawValue).trim();
        if (isNaN(Date.parse(strDate))) {
          throw new BadRequestException(`Value for "${def.name}" must be a valid date.`);
        }
        return new Date(strDate).toISOString();
      }

      case AttributeType.TEXT:
      default:
        return String(rawValue).trim();
    }
  }
}
