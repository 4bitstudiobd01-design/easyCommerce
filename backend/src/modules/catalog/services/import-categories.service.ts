import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { ProductSlugService } from './product-slug.service';
import { CategoryStatus } from '../enums/category-status.enum';
import { ImportCategoriesDto } from '../dto/import-categories.dto';

export interface CategoryImportRowPreview {
  rowIndex: number;
  name: string;
  slug: string;
  description?: string;
  parentSlug?: string;
  status: CategoryStatus;
  sortOrder?: number;
  isVisible: boolean;
  showInStorefront: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  metaDescription?: string;
  isValid: boolean;
  errors: string[];
}

export interface CategoryImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  previewData: CategoryImportRowPreview[];
  errors: { row: number; name?: string; reason: string }[];
}

export interface CategoryImportExecuteResult {
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  failures: { row: number; name?: string; reason: string }[];
}

@Injectable()
export class ImportCategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    private readonly productSlugService: ProductSlugService,
    private readonly dataSource: DataSource,
  ) {}

  public getImportTemplateCsv(): string {
    const headers = [
      'Name',
      'Slug',
      'Description',
      'ParentSlug',
      'Status',
      'SortOrder',
      'IsVisible',
      'ShowInStorefront',
      'IsFeatured',
      'SeoTitle',
      'MetaDescription',
    ];
    const sampleRows = [
      [
        'Fashion & Apparel',
        'fashion-apparel',
        'Clothing, accessories, and style for everyone',
        '',
        'ACTIVE',
        '1',
        'TRUE',
        'TRUE',
        'TRUE',
        'Fashion & Apparel | EasyCommerce',
        'Discover trending fashion clothing and accessories online.',
      ],
      [
        "Men's Fashion",
        'mens-fashion',
        "Men's clothing, footwear and accessories",
        'fashion-apparel',
        'ACTIVE',
        '2',
        'TRUE',
        'TRUE',
        'FALSE',
        "Men's Fashion Collection",
        "Browse top-tier men's clothing and style essentials.",
      ],
      [
        'Electronics',
        'electronics',
        'Smartphones, computers, and electronic gadgets',
        '',
        'ACTIVE',
        '3',
        'TRUE',
        'TRUE',
        'TRUE',
        'Electronics & Gadgets',
        'Premium electronic gadgets with nationwide warranty.',
      ],
    ];

    const formatRow = (cols: string[]) => cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');
    return [formatRow(headers), ...sampleRows.map(formatRow)].join('\n');
  }

  public parseCsvRows(csvContent: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let insideQuote = false;
    let fieldWasQuoted = false;

    const endField = () => {
      row.push(fieldWasQuoted ? field : field.trim());
      field = '';
      fieldWasQuoted = false;
    };

    const endRow = () => {
      endField();
      if (row.some((cell) => cell !== '')) {
        rows.push(row);
      }
      row = [];
    };

    for (let i = 0; i < csvContent.length; i++) {
      const char = csvContent[i];

      if (char === '"') {
        if (insideQuote && csvContent[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
          fieldWasQuoted = true;
        }
      } else if (char === ',' && !insideQuote) {
        endField();
      } else if ((char === '\r' || char === '\n') && !insideQuote) {
        if (char === '\r' && csvContent[i + 1] === '\n') {
          i++;
        }
        endRow();
      } else {
        field += char;
      }
    }

    if (field.length > 0 || row.length > 0) {
      endRow();
    }

    return rows;
  }

  async preview(tenantId: string, csvContent: string): Promise<CategoryImportPreviewResult> {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new BadRequestException('CSV file content is empty');
    }

    const rawRows = this.parseCsvRows(csvContent);
    if (rawRows.length < 2) {
      throw new BadRequestException('CSV must contain at least a header row and one data row');
    }

    const headerRow = rawRows[0].map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));
    const findCol = (...names: string[]): number => {
      for (const name of names) {
        const cleaned = name.toLowerCase().replace(/[\s_-]+/g, '');
        const idx = headerRow.indexOf(cleaned);
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const nameIdx = findCol('name', 'categoryname', 'title');
    if (nameIdx === -1) {
      throw new BadRequestException('CSV header is missing the required "Name" column');
    }

    const slugIdx = findCol('slug', 'categoryslug', 'url');
    const descIdx = findCol('description', 'desc');
    const parentIdx = findCol('parentslug', 'parent', 'parentid', 'parentname');
    const statusIdx = findCol('status');
    const sortOrderIdx = findCol('sortorder', 'order', 'position');
    const isVisibleIdx = findCol('isvisible', 'visible');
    const showInStorefrontIdx = findCol('showinstorefront', 'showinstore');
    const isFeaturedIdx = findCol('isfeatured', 'featured');
    const seoTitleIdx = findCol('seotitle', 'metatitle');
    const metaDescIdx = findCol('metadescription', 'metadesc');

    // Fetch existing categories for tenant to check collisions and resolve parent references
    const existingDbCategories = await this.categoryRepository.find({
      where: { tenantId },
    });

    const dbCategoryBySlug = new Map<string, CategoryEntity>();
    const dbCategoryById = new Map<string, CategoryEntity>();
    const dbCategoryByName = new Map<string, CategoryEntity>();

    existingDbCategories.forEach((c) => {
      dbCategoryBySlug.set(c.slug.toLowerCase(), c);
      dbCategoryById.set(c.id, c);
      dbCategoryByName.set(c.name.toLowerCase(), c);
    });

    const seenCsvSlugs = new Set<string>();
    const csvCategoryBySlug = new Map<string, CategoryImportRowPreview>();
    const previewData: CategoryImportRowPreview[] = [];
    const errors: { row: number; name?: string; reason: string }[] = [];

    // Parse and validate rows
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      const rawName = row[nameIdx]?.trim() || '';
      let rawSlug = slugIdx !== -1 ? row[slugIdx]?.trim() || '' : '';

      if (!rawSlug && rawName) {
        rawSlug = rawName
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      const description = descIdx !== -1 ? row[descIdx]?.trim() : undefined;
      const parentSlug = parentIdx !== -1 ? row[parentIdx]?.trim() || undefined : undefined;
      const rawStatus = statusIdx !== -1 ? row[statusIdx]?.trim().toUpperCase() : 'ACTIVE';
      const sortOrder = sortOrderIdx !== -1 && row[sortOrderIdx] ? parseInt(row[sortOrderIdx], 10) : 0;
      const isVisible = isVisibleIdx !== -1 ? row[isVisibleIdx]?.trim().toUpperCase() !== 'FALSE' : true;
      const showInStorefront = showInStorefrontIdx !== -1 ? row[showInStorefrontIdx]?.trim().toUpperCase() !== 'FALSE' : true;
      const isFeatured = isFeaturedIdx !== -1 ? row[isFeaturedIdx]?.trim().toUpperCase() === 'TRUE' : false;
      const seoTitle = seoTitleIdx !== -1 ? row[seoTitleIdx]?.trim() : undefined;
      const metaDescription = metaDescIdx !== -1 ? row[metaDescIdx]?.trim() : undefined;

      const rowErrors: string[] = [];

      // Validation 1: Name is required
      if (!rawName) {
        rowErrors.push('Category name is required and cannot be empty');
      }

      // Validation 2: Slug validation
      const normalizedSlug = rawSlug.toLowerCase();
      if (!normalizedSlug) {
        rowErrors.push('Category slug is invalid or could not be generated');
      } else if (seenCsvSlugs.has(normalizedSlug)) {
        rowErrors.push(`Duplicate slug "${normalizedSlug}" found multiple times in this CSV`);
      } else {
        seenCsvSlugs.add(normalizedSlug);
      }

      // Validation 3: Status validation
      let status: CategoryStatus = CategoryStatus.ACTIVE;
      if (rawStatus === 'DRAFT') status = CategoryStatus.DRAFT;
      else if (rawStatus === 'ARCHIVED') status = CategoryStatus.ARCHIVED;
      else if (rawStatus !== 'ACTIVE' && rawStatus !== '') {
        rowErrors.push(`Invalid status "${rawStatus}". Must be ACTIVE, DRAFT, or ARCHIVED`);
      }

      const item: CategoryImportRowPreview = {
        rowIndex: r + 1,
        name: rawName,
        slug: normalizedSlug,
        description,
        parentSlug,
        status,
        sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
        isVisible,
        showInStorefront,
        isFeatured,
        seoTitle,
        metaDescription,
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      };

      if (normalizedSlug) {
        csvCategoryBySlug.set(normalizedSlug, item);
      }

      previewData.push(item);
    }

    // Pass 2: Parent resolution & cycle detection across DB + CSV
    for (const item of previewData) {
      if (!item.parentSlug) continue;

      const parentKey = item.parentSlug.toLowerCase();
      const parentInDb = dbCategoryBySlug.get(parentKey) || dbCategoryById.get(item.parentSlug) || dbCategoryByName.get(parentKey);
      const parentInCsv = csvCategoryBySlug.get(parentKey);

      if (!parentInDb && !parentInCsv) {
        item.errors.push(`Parent category "${item.parentSlug}" not found in your store or within this CSV`);
        item.isValid = false;
      }

      // Cycle check within CSV
      if (parentKey === item.slug) {
        item.errors.push(`Category cannot have itself as its parent`);
        item.isValid = false;
      } else if (parentInCsv) {
        let currentParent: CategoryImportRowPreview | undefined = parentInCsv;
        const chain = new Set<string>([item.slug]);

        while (currentParent) {
          if (chain.has(currentParent.slug)) {
            item.errors.push(`Circular hierarchy detected in CSV: ${Array.from(chain).join(' -> ')} -> ${currentParent.slug}`);
            item.isValid = false;
            break;
          }
          chain.add(currentParent.slug);
          currentParent = currentParent.parentSlug ? csvCategoryBySlug.get(currentParent.parentSlug.toLowerCase()) : undefined;
        }
      }
    }

    // Collect summary errors
    previewData.forEach((item) => {
      if (!item.isValid) {
        item.errors.forEach((reason) => {
          errors.push({
            row: item.rowIndex,
            name: item.name || 'Unnamed',
            reason,
          });
        });
      }
    });

    const validRows = previewData.filter((d) => d.isValid).length;
    const invalidRows = previewData.length - validRows;

    return {
      totalRows: previewData.length,
      validRows,
      invalidRows,
      previewData,
      errors,
    };
  }

  async execute(tenantId: string, dto: ImportCategoriesDto): Promise<CategoryImportExecuteResult> {
    const previewResult = await this.preview(tenantId, dto.csvContent);

    if (previewResult.invalidRows > 0) {
      const topErrors = previewResult.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.reason}`).join('; ');
      throw new BadRequestException(`Cannot import CSV with validation errors: ${topErrors}`);
    }

    const mode = dto.mode || 'CREATE_ONLY';
    const failures: { row: number; name?: string; reason: string }[] = [];
    let createdCount = 0;
    let updatedCount = 0;

    await this.dataSource.transaction(async (manager) => {
      const categoryRepo = manager.getRepository(CategoryEntity);

      // Preload current tenant categories
      const existingCategories = await categoryRepo.find({ where: { tenantId } });
      const slugMap = new Map<string, CategoryEntity>();
      const idMap = new Map<string, CategoryEntity>();
      const nameMap = new Map<string, CategoryEntity>();

      existingCategories.forEach((c) => {
        slugMap.set(c.slug.toLowerCase(), c);
        idMap.set(c.id, c);
        nameMap.set(c.name.toLowerCase(), c);
      });

      // Topological sorting: calculate depth for CSV rows so parents are created before children
      const csvRows = previewResult.previewData;
      const rowBySlug = new Map<string, CategoryImportRowPreview>();
      csvRows.forEach((r) => rowBySlug.set(r.slug, r));

      const getDepth = (row: CategoryImportRowPreview, visited = new Set<string>()): number => {
        if (!row.parentSlug) return 0;
        const parentKey = row.parentSlug.toLowerCase();
        if (slugMap.has(parentKey) || idMap.has(row.parentSlug) || nameMap.has(parentKey)) {
          return 1;
        }
        const parentRow = rowBySlug.get(parentKey);
        if (!parentRow || visited.has(row.slug)) return 0;
        visited.add(row.slug);
        return 1 + getDepth(parentRow, visited);
      };

      const sortedRows = [...csvRows].sort((a, b) => getDepth(a) - getDepth(b));

      for (const row of sortedRows) {
        // Resolve parent ID
        let resolvedParentId: string | null = null;
        if (row.parentSlug) {
          const parentKey = row.parentSlug.toLowerCase();
          const parentEntity = slugMap.get(parentKey) || idMap.get(row.parentSlug) || nameMap.get(parentKey);
          if (parentEntity) {
            resolvedParentId = parentEntity.id;
          }
        }

        const existing = slugMap.get(row.slug);

        if (existing) {
          if (mode === 'UPSERT') {
            existing.name = row.name;
            existing.description = row.description;
            existing.parentId = resolvedParentId;
            existing.status = row.status;
            existing.sortOrder = row.sortOrder ?? existing.sortOrder;
            existing.isVisible = row.isVisible;
            existing.showInStorefront = row.showInStorefront;
            existing.isFeatured = row.isFeatured;
            existing.seoTitle = row.seoTitle;
            existing.metaDescription = row.metaDescription;
            existing.updatedAt = new Date();

            const saved = await categoryRepo.save(existing);
            slugMap.set(saved.slug.toLowerCase(), saved);
            idMap.set(saved.id, saved);
            nameMap.set(saved.name.toLowerCase(), saved);
            updatedCount++;
          } else {
            // CREATE_ONLY: skip existing
            failures.push({
              row: row.rowIndex,
              name: row.name,
              reason: `Category with slug "${row.slug}" already exists (skipped in CREATE_ONLY mode)`,
            });
          }
        } else {
          // Create new category
          const newCategory = categoryRepo.create({
            tenantId,
            name: row.name,
            slug: row.slug,
            description: row.description,
            parentId: resolvedParentId,
            status: row.status,
            sortOrder: row.sortOrder ?? 0,
            isVisible: row.isVisible,
            showInStorefront: row.showInStorefront,
            isFeatured: row.isFeatured,
            seoTitle: row.seoTitle,
            metaDescription: row.metaDescription,
          });

          const saved = await categoryRepo.save(newCategory);
          slugMap.set(saved.slug.toLowerCase(), saved);
          idMap.set(saved.id, saved);
          nameMap.set(saved.name.toLowerCase(), saved);
          createdCount++;
        }
      }
    });

    return {
      totalRows: previewResult.totalRows,
      createdCount,
      updatedCount,
      failedCount: failures.length,
      failures,
    };
  }
}
