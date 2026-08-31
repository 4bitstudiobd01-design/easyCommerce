import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFinanceTransferDto {
  @IsUUID()
  @IsNotEmpty()
  fromAccountId: string;

  @IsUUID()
  @IsNotEmpty()
  toAccountId: string;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  fee?: number;

  @IsString()
  @IsNotEmpty()
  transferDate: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
