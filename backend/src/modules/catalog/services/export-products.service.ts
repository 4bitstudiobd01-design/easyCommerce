import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { ProductListDto } from '../dto/product-list.dto';

@Injectable()
export class ExportProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  public sanitizeCsvFormula(value: any): string {
    if (value === null || value === undefined) return '';
    const str = value.toString();
    const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
      return "'" + str;
    }
    return str;
  }

  public formatCsvRow(columns: any[]): string {
    return columns
      .map((col) => {
        const sanitized = this.sanitizeCsvFormula(col);
        const escaped = sanitized.replace(/"/g, '""');
        return '"' + escaped + '"';
      })
      .join(',');
  }

  async execute(tenantId: string, dto: ProductListDto, productIds?: string[]): Promise<string> {
    const qb = this.productRepository.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.collections', 'collections')
      .where('p.tenantId = :tenantId', { tenantId });

    if (productIds && productIds.length > 0) {
      qb.andWhere('p.id IN (:...productIds)', { productIds });
    }

    if (dto.search && dto.search.trim() !== '') {
      const s = `%${dto.search.trim()}%`;
      qb.andWhere('(p.name ILIKE :s OR p.slug ILIKE :s OR p.sku ILIKE :s OR p.barcode ILIKE :s)', { s });
    }

    if (dto.status && (dto.status as string) !== 'ALL') {
      qb.andWhere('p.status = :status', { status: dto.status });
    }

    if (dto.productType && (dto.productType as string) !== 'ALL') {
      qb.andWhere('p.productType = :productType', { productType: dto.productType });
    }

    if (dto.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId: dto.categoryId });
    }

    if (dto.brandId) {
      qb.andWhere('p.brandId = :brandId', { brandId: dto.brandId });
    }

    qb.orderBy('p.createdAt', 'DESC');

    const products = await qb.getMany();

    const headers = [
      'id',
      'name',
      'slug',
      'sku',
      'barcode',
      'productType',
      'status',
      'basePrice',
      'compareAtPrice',
      'costPrice',
      'trackInventory',
      'allowBackorder',
      'lowStockThreshold',
      'category',
      'brand',
      'weight',
      'weightUnit',
      'length',
      'width',
      'height',
      'dimensionUnit',
      'isFragile',
    ];

    const rows: string[] = [this.formatCsvRow(headers)];

    for (const p of products) {
      rows.push(
        this.formatCsvRow([
          p.id,
          p.name,
          p.slug,
          p.sku || '',
          p.barcode || '',
          p.productType,
          p.status,
          p.basePrice,
          p.compareAtPrice ?? '',
          p.costPrice ?? '',
          p.trackInventory ? 'TRUE' : 'FALSE',
          p.allowBackorder ? 'TRUE' : 'FALSE',
          p.lowStockThreshold ?? 10,
          p.category?.name || '',
          p.brand?.name || '',
          p.weight ?? '',
          p.weightUnit || '',
          p.length ?? '',
          p.width ?? '',
          p.height ?? '',
          p.dimensionUnit || '',
          p.isFragile ? 'TRUE' : 'FALSE',
        ]),
      );
    }

    return rows.join('\n');
  }
}
