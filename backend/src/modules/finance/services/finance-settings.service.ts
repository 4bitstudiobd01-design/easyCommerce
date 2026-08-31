import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceSettingEntity } from '../entities/finance-setting.entity';
import { UpdateFinanceSettingsDto } from '../dto/settings.dto';

@Injectable()
export class GetFinanceSettingsService {
  constructor(
    @InjectRepository(FinanceSettingEntity)
    private readonly settingRepository: Repository<FinanceSettingEntity>,
  ) {}

  async execute(tenantId: string, storeId: string): Promise<FinanceSettingEntity> {
    let setting = await this.settingRepository.findOne({
      where: { storeId },
    });

    if (!setting) {
      setting = this.settingRepository.create({
        tenantId,
        storeId,
        currency: 'BDT',
        currencySymbol: '৳',
        defaultTaxRate: '0',
        invoicePrefix: 'INV-',
        billPrefix: 'BILL-',
        invoiceFooterNote: 'Thank you for your business!',
        invoiceTerms: 'Payment due within 15 days of issue.',
      });
      setting = await this.settingRepository.save(setting);
    }

    return setting;
  }
}

@Injectable()
export class UpdateFinanceSettingsService {
  constructor(
    @InjectRepository(FinanceSettingEntity)
    private readonly settingRepository: Repository<FinanceSettingEntity>,
    private readonly getFinanceSettingsService: GetFinanceSettingsService,
  ) {}

  async execute(
    tenantId: string,
    storeId: string,
    dto: UpdateFinanceSettingsDto,
  ): Promise<FinanceSettingEntity> {
    const setting = await this.getFinanceSettingsService.execute(tenantId, storeId);

    if (dto.currency !== undefined) setting.currency = dto.currency;
    if (dto.currencySymbol !== undefined) setting.currencySymbol = dto.currencySymbol;
    if (dto.defaultTaxRate !== undefined) setting.defaultTaxRate = String(dto.defaultTaxRate);
    if (dto.taxNumber !== undefined) setting.taxNumber = dto.taxNumber;
    if (dto.invoicePrefix !== undefined) setting.invoicePrefix = dto.invoicePrefix;
    if (dto.billPrefix !== undefined) setting.billPrefix = dto.billPrefix;
    if (dto.defaultSalesAccountId !== undefined) setting.defaultSalesAccountId = dto.defaultSalesAccountId;
    if (dto.defaultExpenseAccountId !== undefined) setting.defaultExpenseAccountId = dto.defaultExpenseAccountId;
    if (dto.invoiceFooterNote !== undefined) setting.invoiceFooterNote = dto.invoiceFooterNote;
    if (dto.invoiceTerms !== undefined) setting.invoiceTerms = dto.invoiceTerms;

    return this.settingRepository.save(setting);
  }
}
