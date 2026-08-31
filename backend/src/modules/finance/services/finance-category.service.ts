import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceCategoryEntity } from '../entities/finance-category.entity';
import { CreateFinanceCategoryDto } from '../dto/category.dto';
import { FinanceCategoryTypeEnum } from '../enums/finance.enums';

const DEFAULT_CATEGORIES = [
  { name: 'Product Sales', code: 'PRODUCT_SALES', type: FinanceCategoryTypeEnum.INCOME, color: '#10b981' },
  { name: 'Shipping Income', code: 'SHIPPING_INCOME', type: FinanceCategoryTypeEnum.INCOME, color: '#0ea5e9' },
  { name: 'Other Income', code: 'OTHER_INCOME', type: FinanceCategoryTypeEnum.INCOME, color: '#8b5cf6' },
  { name: 'Cost of Goods Sold (COGS)', code: 'COGS', type: FinanceCategoryTypeEnum.EXPENSE, color: '#ef4444' },
  { name: 'Marketing & Advertising', code: 'MARKETING', type: FinanceCategoryTypeEnum.EXPENSE, color: '#f59e0b' },
  { name: 'Salaries & Payroll', code: 'SALARY', type: FinanceCategoryTypeEnum.EXPENSE, color: '#ec4899' },
  { name: 'Employee Expenses', code: 'EMPLOYEE_EXPENSE', type: FinanceCategoryTypeEnum.EXPENSE, color: '#6366f1' },
  { name: 'Rent & Office', code: 'RENT', type: FinanceCategoryTypeEnum.EXPENSE, color: '#14b8a6' },
  { name: 'Utilities & Bills', code: 'UTILITIES', type: FinanceCategoryTypeEnum.EXPENSE, color: '#f97316' },
  { name: 'Software & Tools', code: 'SOFTWARE', type: FinanceCategoryTypeEnum.EXPENSE, color: '#3b82f6' },
  { name: 'Shipping & Delivery', code: 'SHIPPING', type: FinanceCategoryTypeEnum.EXPENSE, color: '#84cc16' },
  { name: 'Other Expenses', code: 'OTHER', type: FinanceCategoryTypeEnum.EXPENSE, color: '#64748b' },
];

@Injectable()
export class ListCategoriesService {
  constructor(
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
  ) {}

  async execute(tenantId: string, storeId: string, type?: FinanceCategoryTypeEnum) {
    let categories = await this.categoryRepository.find({
      where: type ? { storeId, type } : { storeId },
      order: { isSystem: 'DESC', name: 'ASC' },
    });

    if (categories.length === 0) {
      // Seed default categories for this store
      for (const cat of DEFAULT_CATEGORIES) {
        const entity = this.categoryRepository.create({
          tenantId,
          storeId,
          name: cat.name,
          code: cat.code,
          type: cat.type,
          color: cat.color,
          isSystem: true,
        });
        await this.categoryRepository.save(entity);
      }

      categories = await this.categoryRepository.find({
        where: type ? { storeId, type } : { storeId },
        order: { isSystem: 'DESC', name: 'ASC' },
      });
    }

    return categories;
  }
}

@Injectable()
export class CreateCategoryService {
  constructor(
    @InjectRepository(FinanceCategoryEntity)
    private readonly categoryRepository: Repository<FinanceCategoryEntity>,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: CreateFinanceCategoryDto,
  ): Promise<FinanceCategoryEntity> {
    const code = dto.code.toUpperCase().replace(/\s+/g, '_');
    const category = this.categoryRepository.create({
      tenantId,
      storeId,
      name: dto.name,
      code,
      type: dto.type,
      color: dto.color || '#64748b',
      description: dto.description,
      isSystem: false,
    });

    return this.categoryRepository.save(category);
  }
}
