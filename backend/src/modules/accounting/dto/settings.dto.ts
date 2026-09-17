import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AccountMappingEventEnum } from '../entities/account-mapping.entity';
import { NumberingDocTypeEnum } from '../entities/numbering-rule.entity';

export class UpdateAccountingSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;

  @IsOptional()
  @IsBoolean()
  autoPostEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  allowDraftEntries?: boolean;
}

export class UpdateAccountMappingDto {
  @IsEnum(AccountMappingEventEnum)
  event: AccountMappingEventEnum;

  @IsOptional()
  @IsString()
  accountId?: string | null;
}

export class UpdateNumberingRuleDto {
  @IsEnum(NumberingDocTypeEnum)
  docType: NumberingDocTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  prefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  suffix?: string;

  @IsOptional()
  @IsBoolean()
  includeYear?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  padWidth?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  nextSequence?: number;
}
