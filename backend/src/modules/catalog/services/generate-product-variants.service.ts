import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariantEntity, VariantOptionMeta } from '../entities/product-variant.entity';
import { AttributeDefinitionEntity } from '../entities/attribute-definition.entity';
import { AttributeOptionEntity } from '../entities/attribute-option.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { GenerateProductVariantsDto } from '../dto/generate-product-variants.dto';

// Upper bound on how many variant rows one generate call may create. Kept as a
// guard against a runaway Cartesian product (each combination also writes an
// inventory_stocks row), but raised so realistic multi-axis catalogues fit.
const MAX_VARIANT_COMBINATIONS = 200;

@Injectable()
export class GenerateProductVariantsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductVariantEntity)
    private readonly variantRepository: Repository<ProductVariantEntity>,
    @InjectRepository(AttributeDefinitionEntity)
    private readonly attributeRepository: Repository<AttributeDefinitionEntity>,
    @InjectRepository(AttributeOptionEntity)
    private readonly optionRepository: Repository<AttributeOptionEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(productId: string, tenantId: string, dto: GenerateProductVariantsDto): Promise<ProductVariantEntity[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found or access denied');
    }

    if (!dto.dimensions || dto.dimensions.length === 0) {
      throw new BadRequestException('At least one variant dimension is required');
    }

    const attributeIds = dto.dimensions.map((d) => d.attributeId);
    const attributes = await this.attributeRepository.find({
      where: { id: In(attributeIds), tenantId },
    });

    if (attributes.length !== attributeIds.length) {
      throw new BadRequestException('One or more selected attributes do not exist in tenant');
    }

    // Validate that ALL selected attributes have isVariantOption = true
    const invalidAttribute = attributes.find((attr) => !attr.isVariantOption);
    if (invalidAttribute) {
      throw new BadRequestException(`Attribute "${invalidAttribute.name}" is not enabled as a variant option`);
    }

    // Map dimensions with resolved attribute and options
    const dimensionMaps = await Promise.all(
      dto.dimensions.map(async (dim) => {
        const attr = attributes.find((a) => a.id === dim.attributeId)!;
        const options = await this.optionRepository.find({
          where: { id: In(dim.optionIds), attributeId: dim.attributeId },
          order: { sortOrder: 'ASC' },
        });

        if (options.length === 0) {
          throw new BadRequestException(`At least one option must be selected for attribute "${attr.name}"`);
        }

        return {
          attribute: attr,
          options,
        };
      }),
    );

    // Sort dimension maps by attribute sortOrder for deterministic combination keys
    dimensionMaps.sort((a, b) => a.attribute.sortOrder - b.attribute.sortOrder);

    // Compute Cartesian product
    const combinations = this.cartesianProduct(dimensionMaps);
    if (combinations.length > MAX_VARIANT_COMBINATIONS) {
      throw new BadRequestException(
        `Combinatorial generation produces ${combinations.length} variants, which exceeds the maximum limit of ${MAX_VARIANT_COMBINATIONS}. Please select fewer options.`,
      );
    }

    // Fetch existing variants for preservation
    const existingVariants = await this.variantRepository.find({
      where: { productId, tenantId },
    });
    const existingKeyMap = new Map<string, ProductVariantEntity>();
    existingVariants.forEach((v) => {
      if (v.combinationKey) {
        existingKeyMap.set(v.combinationKey, v);
      }
    });

    const resultVariants: ProductVariantEntity[] = [];

    // Transactional creation & preservation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const combo of combinations) {
        // combo is an array of { attribute: AttributeDefinitionEntity, option: AttributeOptionEntity }
        const keyParts = combo.map(
          (item) => `${item.attribute.key.toLowerCase()}:${item.option.value.toLowerCase()}`,
        );
        const combinationKey = keyParts.join('|');
        const title = combo.map((item) => item.option.label || item.option.value).join(' / ');

        const optionMetas: VariantOptionMeta[] = combo.map((item) => ({
          attributeId: item.attribute.id,
          attributeName: item.attribute.name,
          optionId: item.option.id,
          optionLabel: item.option.label || item.option.value,
          value: item.option.value,
        }));

        let variant = existingKeyMap.get(combinationKey);
        if (variant) {
          variant.title = title;
          variant.options = optionMetas;
          variant = await queryRunner.manager.save(ProductVariantEntity, variant);
        } else {
          // Derive a SKU from the parent product plus the option values. Generated
          // variants previously had sku = null, which left them unidentifiable in
          // inventory, order lines and CSV export. Uniqueness is enforced by the
          // (tenantId, sku) index, so fall back to a suffixed value on collision.
          const skuSuffix = combo
            .map((item) => item.option.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
            .join('-');
          const baseSku = product.sku ? `${product.sku}-${skuSuffix}` : null;

          let variantSku: string | undefined = baseSku || undefined;
          if (variantSku) {
            const clash = await queryRunner.manager.findOne(ProductVariantEntity, {
              where: { sku: variantSku, tenantId },
            });
            if (clash) {
              variantSku = `${baseSku}-${Date.now().toString().slice(-5)}`;
            }
          }

          variant = queryRunner.manager.create(ProductVariantEntity, {
            title,
            sku: variantSku,
            combinationKey,
            options: optionMetas,
            price: product.basePrice,
            compareAtPrice: product.compareAtPrice,
            costPrice: product.costPrice,
            isEnabled: true,
            productId,
            tenantId,
          });
          variant = await queryRunner.manager.save(ProductVariantEntity, variant);

          // Create variant inventory stock record
          const variantStock = queryRunner.manager.create(InventoryStockEntity, {
            productId,
            variantId: variant.id,
            warehouseId: (await queryRunner.manager.find(InventoryStockEntity, { where: { productId, tenantId } }))[0]?.warehouseId || undefined,
            quantityOnHand: 0,
            quantityReserved: 0,
            reorderPoint: product.lowStockThreshold || 10,
            tenantId,
          });
          await queryRunner.manager.save(InventoryStockEntity, variantStock);
        }

        resultVariants.push(variant);
      }

      product.hasVariants = true;
      await queryRunner.manager.save(ProductEntity, product);
      await queryRunner.commitTransaction();

      return resultVariants;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private cartesianProduct(
    dimensions: Array<{ attribute: AttributeDefinitionEntity; options: AttributeOptionEntity[] }>,
  ): Array<Array<{ attribute: AttributeDefinitionEntity; option: AttributeOptionEntity }>> {
    return dimensions.reduce<Array<Array<{ attribute: AttributeDefinitionEntity; option: AttributeOptionEntity }>>>(
      (acc, dim) => {
        const res: Array<Array<{ attribute: AttributeDefinitionEntity; option: AttributeOptionEntity }>> = [];
        acc.forEach((existingCombo) => {
          dim.options.forEach((opt) => {
            res.push([...existingCombo, { attribute: dim.attribute, option: opt }]);
          });
        });
        return res;
      },
      [[]],
    );
  }
}
