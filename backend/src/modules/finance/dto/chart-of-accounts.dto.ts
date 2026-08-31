import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import {
  FinanceAccountClassEnum,
  FinanceNormalBalanceEnum,
} from '../enums/finance.enums';

export class CreateChartOfAccountDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(FinanceAccountClassEnum)
  @IsNotEmpty()
  accountClass: FinanceAccountClassEnum;

  @IsString()
  @IsOptional()
  subType?: string;

  @IsEnum(FinanceNormalBalanceEnum)
  @IsNotEmpty()
  normalBalance: FinanceNormalBalanceEnum;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  startingBalance?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateChartOfAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subType?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryChartOfAccountsDto {
  @IsEnum(FinanceAccountClassEnum)
  @IsOptional()
  accountClass?: FinanceAccountClassEnum;

  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
