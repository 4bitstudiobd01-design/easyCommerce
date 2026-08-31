import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { FinanceAccountTypeEnum } from '../enums/finance.enums';

export class CreateFinanceAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(FinanceAccountTypeEnum)
  type: FinanceAccountTypeEnum;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  bankOrProviderName?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  startingBalance?: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateFinanceAccountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(FinanceAccountTypeEnum)
  @IsOptional()
  type?: FinanceAccountTypeEnum;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  bankOrProviderName?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
