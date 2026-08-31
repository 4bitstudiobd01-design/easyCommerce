import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FinanceJournalEntryTypeEnum,
  FinanceLineTypeEnum,
  FinancePartyTypeEnum,
  FinanceJournalStatusEnum,
} from '../enums/finance.enums';

export class CreateJournalLineDto {
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @IsEnum(FinanceLineTypeEnum)
  @IsNotEmpty()
  type: FinanceLineTypeEnum;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(FinancePartyTypeEnum)
  @IsOptional()
  partyType?: FinancePartyTypeEnum;

  @IsString()
  @IsOptional()
  partyId?: string;

  @IsString()
  @IsOptional()
  partyName?: string;
}

export class CreateJournalEntryDto {
  @IsString()
  @IsNotEmpty()
  entryDate: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(FinanceJournalEntryTypeEnum)
  @IsOptional()
  sourceType?: FinanceJournalEntryTypeEnum;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  sourceReference?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines: CreateJournalLineDto[];
}

export class QueryJournalEntriesDto {
  @IsEnum(FinanceJournalEntryTypeEnum)
  @IsOptional()
  sourceType?: FinanceJournalEntryTypeEnum;

  @IsEnum(FinanceJournalStatusEnum)
  @IsOptional()
  status?: FinanceJournalStatusEnum;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
