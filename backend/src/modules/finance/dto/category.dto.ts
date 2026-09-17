import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FinanceCategoryTypeEnum } from '../enums/finance.enums';

export class CreateFinanceCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(FinanceCategoryTypeEnum)
  type: FinanceCategoryTypeEnum;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateFinanceCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
