import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';

/** Offline/manual payment methods a merchant can log against an order. */
export enum ManualPaymentMethodEnum {
  CASH = 'CASH',
  BKASH = PaymentMethodTypeEnum.BKASH,
  NAGAD = PaymentMethodTypeEnum.NAGAD,
  ROCKET = PaymentMethodTypeEnum.ROCKET,
  BANK_TRANSFER = PaymentMethodTypeEnum.BANK_TRANSFER,
  OTHER = 'OTHER',
}

export class RecordManualPaymentDto {
  @ApiProperty({ example: 500, description: 'Amount received, must not exceed the current balance due' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: ManualPaymentMethodEnum, example: ManualPaymentMethodEnum.CASH })
  @IsEnum(ManualPaymentMethodEnum)
  method: ManualPaymentMethodEnum;

  @ApiProperty({ required: false, example: 'Received in person at pickup' })
  @IsOptional()
  @IsString()
  note?: string;
}
