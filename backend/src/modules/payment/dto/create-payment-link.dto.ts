import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentLinkDto {
  @ApiProperty({ required: false, example: 500, description: 'Amount to charge; defaults to the full balance due when omitted' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({ required: false, example: false, description: 'Also send the link to the customer via SMS' })
  @IsOptional()
  @IsBoolean()
  sendSms?: boolean;
}
