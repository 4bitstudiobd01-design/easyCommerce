import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { CategoryEntity } from '../entities/category.entity';
import { BrandEntity } from '../entities/brand.entity';
import { InventoryStockEntity } from '../../inventory/entities/inventory-stock.entity';
import { WarehouseEntity } from '../../inventory/entities/warehouse.entity';
import { ProductSlugService } from './product-slug.service';
import { ProductType } from '../enums/product-type.enum';
import { ProductStatus } from '../enums/product-status.enum';

export type ImportMode = 'CREATE' | 'UPDATE' | 'UPSERT';

export interface ImportProductsDto {
  csvContent: string;
  mode?: ImportMode;
}

export interface ImportRowFailure {
  row: number;
  name?: string;
  sku?: string;
  reason: string;
}

export interface ImportProductsResult {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  failures: ImportRowFailure[];
}

@Injectable()
export class ImportProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(BrandEntity)
    private readonly brandRepository: Repository<BrandEntity>,
    @InjectRepository(InventoryStockEntity)
    private readonly stockRepository: Repository<InventoryStockEntity>,
    @InjectRepository(WarehouseEntity)
    private readonly warehouseRepository: Repository<WarehouseEntity>,
    private readonly productSlugService: ProductSlugService,
  ) {}

  /**
   * inventory_stocks.warehouseId is NOT NULL; importing without one aborted the whole
   * request with a raw constraint error. Mirrors ListWarehousesService's auto-init.
   */
  private async resolveDefaultWarehouseId(tenantId: string): Promise<string> {
    const existing = await this.warehouseRepository.findOne({
      where: { tenantId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
    if (existing) return existing.id;

    const created = await this.warehouseRepository.save(
      this.warehouseRepository.create({
        name: 'Main Store Warehouse',
        code: 'WH-MAIN',
        isDefault: true,
        address: 'Main Store Location',
        tenantId,
      }),
    );
    return created.id;
  }

  public parseCsvRows(csvContent: string): string[][] {
    // Parsed as a single pass over the whole document rather than splitting on newlines
    // first: a quoted field may legally contain a line break (RFC 4180), and pre-splitting
    // tore such a record into two corrupt rows (e.g. a product description with a newline
    // silently imported a product named "Multi" plus a junk row).
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let insideQuote = false;
    let fieldWasQuoted = false;

    const endField = () => {
      // Only unquoted fields are trimmed; whitespace inside quotes is intentional data.
      row.push(fieldWasQuoted ? field : field.trim());
      field = '';
      fieldWasQuoted = false;
    };

    const endRow = () => {
      endField();
      // Skip rows that are entirely empty (trailing newlines, blank separator lines).
      if (row.some((cell) => cell !== '')) {
        rows.push(row);
      }
      row = [];
    };

    for (let i = 0; i < csvContent.length; i++) {
      const char = csvContent[i];

      if (insideQuote) {
        if (char === '"') {
          if (csvContent[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            insideQuote = false;
          }
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        insideQuote = true;
        fieldWasQuoted = true;
      } else if (char === ',') {
        endField();
      } else if (char === '\r') {
        // Normalise CRLF: the \n handler closes the row.
        if (csvContent[i + 1] !== '\n') {
          endRow();
        }
      } else if (char === '\n') {
        endRow();
      } else {
        field += char;
      }
    }

    // Flush any trailing record that is not newline-terminated.
    if (field !== '' || fieldWasQuoted || row.length > 0) {
      endRow();
    }

    return rows;
  }

  async execute(tenantId: string, dto: ImportProductsDto): Promise<ImportProductsResult> {
    if (!dto.csvContent || !dto.csvContent.trim()) {
      throw new BadRequestException('CSV content is empty');
    }

    const rows = this.parseCsvRows(dto.csvContent);
    if (rows.length < 2) {
      throw new BadRequestException('CSV file must contain a header row and at least one data row');
    }

    const header = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const mode: ImportMode = dto.mode || 'UPSERT';

    const colIndex = (key: string) => header.indexOf(key.toLowerCase());

    const nameIdx = colIndex('name');
    const skuIdx = colIndex('sku');
    const priceIdx = colIndex('baseprice') !== -1 ? colIndex('baseprice') : colIndex('price');
    const typeIdx = colIndex('producttype') !== -1 ? colIndex('producttype') : colIndex('type');
    const statusIdx = colIndex('status');
    const barcodeIdx = colIndex('barcode');
    const categoryIdx = colIndex('category');
    const brandIdx = colIndex('brand');

    if (nameIdx === -1 && skuIdx === -1) {
      throw new BadRequestException('CSV missing required header columns: "name" or "sku"');
    }

    const dataRows = rows.slice(1);
    const failures: ImportRowFailure[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    const warehouseId = await this.resolveDefaultWarehouseId(tenantId);
    // SKUs already consumed by earlier rows of THIS file. Per-row DB lookups cannot see
    // rows created moments earlier in the same import, so two identical SKUs in one CSV
    // both passed validation and the second hit the unique index as an unhandled 500.
    const seenSkus = new Set<string>();

    for (let rIndex = 0; rIndex < dataRows.length; rIndex++) {
      const row = dataRows[rIndex];
      const rowNum = rIndex + 2;
      const nameVal = nameIdx !== -1 ? row[nameIdx] : '';
      const skuVal = skuIdx !== -1 ? row[skuIdx] : '';

      try {
      const priceVal = priceIdx !== -1 ? row[priceIdx] : '';
      const typeVal = typeIdx !== -1 ? row[typeIdx] : '';
      const statusVal = statusIdx !== -1 ? row[statusIdx] : '';
      const barcodeVal = barcodeIdx !== -1 ? row[barcodeIdx] : '';
      const categoryVal = categoryIdx !== -1 ? row[categoryIdx] : '';
      const brandVal = brandIdx !== -1 ? row[brandIdx] : '';

      if (!nameVal && !skuVal) {
        failures.push({ row: rowNum, reason: 'Row missing both name and SKU' });
        continue;
      }

      if (skuVal && seenSkus.has(skuVal)) {
        failures.push({
          row: rowNum,
          sku: skuVal,
          name: nameVal,
          reason: `Duplicate SKU "${skuVal}" appears more than once in this file`,
        });
        continue;
      }

      // Check for SKU match in tenant
      let existingProduct: ProductEntity | null = null;
      if (skuVal) {
        existingProduct = await this.productRepository.findOne({
          where: { sku: skuVal, tenantId },
        });
      }

      if (mode === 'CREATE' && existingProduct) {
        failures.push({ row: rowNum, sku: skuVal, name: nameVal, reason: `Product with SKU "${skuVal}" already exists` });
        continue;
      }

      if (mode === 'UPDATE' && !existingProduct) {
        failures.push({ row: rowNum, sku: skuVal, name: nameVal, reason: `Product with SKU "${skuVal}" not found for update` });
        continue;
      }

      // Validate numeric price if provided
      let numericPrice = existingProduct?.basePrice ?? 0;
      if (priceVal !== '') {
        const parsedPrice = parseFloat(priceVal);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          failures.push({ row: rowNum, sku: skuVal, name: nameVal, reason: `Invalid price "${priceVal}"` });
          continue;
        }
        numericPrice = parsedPrice;
      }

      // Parse productType
      let productType = existingProduct?.productType || ProductType.PHYSICAL;
      if (typeVal) {
        const normalizedType = typeVal.toUpperCase();
        if (['PHYSICAL', 'DIGITAL', 'SERVICE'].includes(normalizedType)) {
          productType = normalizedType as ProductType;
        }
      }

      // Parse status
      let status = existingProduct?.status || ProductStatus.DRAFT;
      if (statusVal) {
        const normalizedStatus = statusVal.toUpperCase();
        if (['DRAFT', 'ACTIVE', 'ARCHIVED'].includes(normalizedStatus)) {
          status = normalizedStatus as ProductStatus;
        }
      }

      // Category lookup
      let categoryId = existingProduct?.categoryId;
      if (categoryVal) {
        const cat = await this.categoryRepository.findOne({
          where: { name: categoryVal, tenantId },
        });
        if (cat) categoryId = cat.id;
      }

      // Brand lookup
      let brandId = existingProduct?.brandId;
      if (brandVal) {
        const b = await this.brandRepository.findOne({
          where: { name: brandVal, tenantId },
        });
        if (b) brandId = b.id;
      }

      if (existingProduct) {
        // UPDATE
        existingProduct.name = nameVal || existingProduct.name;
        existingProduct.basePrice = numericPrice;
        existingProduct.productType = productType;
        existingProduct.status = status;
        existingProduct.isPublished = status === ProductStatus.ACTIVE;
        existingProduct.barcode = barcodeVal || existingProduct.barcode;
        existingProduct.categoryId = categoryId;
        existingProduct.brandId = brandId;

        await this.productRepository.save(existingProduct);
        if (skuVal) seenSkus.add(skuVal);
        updatedCount++;
      } else {
        // CREATE
        const prodName = nameVal || `Imported Product ${skuVal}`;
        const slug = await this.productSlugService.generateSlug(prodName, tenantId);

        const newProduct = this.productRepository.create({
          name: prodName,
          slug,
          sku: skuVal || undefined,
          barcode: barcodeVal || undefined,
          productType,
          status,
          isPublished: status === ProductStatus.ACTIVE,
          basePrice: numericPrice,
          categoryId,
          brandId,
          tenantId,
        });

        const saved = await this.productRepository.save(newProduct);

        // Initialize inventory stock
        const stock = this.stockRepository.create({
          productId: saved.id,
          warehouseId,
          quantityOnHand: 0,
          quantityReserved: 0,
          tenantId,
        });
        await this.stockRepository.save(stock);
        if (skuVal) seenSkus.add(skuVal);
        createdCount++;
      }
      } catch (err) {
        // Keep the import going: one bad row is reported as a failure rather than
        // aborting the request and losing every successfully processed row.
        const reason = err instanceof Error ? err.message : 'Unexpected error importing row';
        failures.push({ row: rowNum, sku: skuVal || undefined, name: nameVal || undefined, reason });
      }
    }

    return {
      totalRows: dataRows.length,
      createdCount,
      updatedCount,
      failedCount: failures.length,
      failures,
    };
  }

  getImportTemplateCsv(): string {
    const headers = ['name', 'sku', 'barcode', 'productType', 'status', 'basePrice', 'compareAtPrice', 'costPrice', 'category', 'brand'];
    const sampleRow1 = ['Men Cotton Polo Shirt', 'TS-POLO-001', '894000111222', 'PHYSICAL', 'ACTIVE', '1250', '1500', '700', 'Fashion', 'EasyBrand'];
    const sampleRow2 = ['Python Programming eBook', 'EB-PY-002', '', 'DIGITAL', 'ACTIVE', '450', '600', '0', 'Books', 'BitCommerce'];

    return [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
  }
}
