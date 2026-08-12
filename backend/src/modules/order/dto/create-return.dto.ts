import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
  @IsString()
  @IsNotEmpty()
  orderItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreateReturnDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsString()
  @IsOptional()
  note?: string;
}
