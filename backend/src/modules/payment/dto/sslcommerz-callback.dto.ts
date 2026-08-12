import { ApiProperty } from '@nestjs/swagger';

export class SslCommerzCallbackDto {
  @ApiProperty({ example: 'VALID', description: 'Payment status returned by SSLCommerz', required: false })
  status?: string;

  @ApiProperty({ example: '2026-08-13 12:00:00', description: 'Transaction date', required: false })
  tran_date?: string;

  @ApiProperty({ example: 'EC-1699999999-abc123', description: 'Merchant transaction ID' })
  tran_id: string;

  @ApiProperty({ example: '240426105805YCbUEnRnE1e77n7', description: 'SSLCommerz validation ID', required: false })
  val_id?: string;

  @ApiProperty({ example: '1000.00', description: 'Transaction amount', required: false })
  amount?: string;

  @ApiProperty({ example: '990.00', description: 'Amount credited to store after gateway charges', required: false })
  store_amount?: string;

  @ApiProperty({ example: 'BDT', description: 'Transaction currency', required: false })
  currency?: string;

  @ApiProperty({ example: '1234567890', description: 'Bank transaction ID', required: false })
  bank_tran_id?: string;

  @ApiProperty({ example: 'VISA', description: 'Card type used for payment', required: false })
  card_type?: string;

  @ApiProperty({ example: '432097XXXXXX0012', description: 'Masked card number', required: false })
  card_no?: string;

  @ApiProperty({ example: 'BRAC BANK', description: 'Card issuing bank', required: false })
  card_issuer?: string;

  @ApiProperty({ example: 'VISA', description: 'Card brand', required: false })
  card_brand?: string;

  @ApiProperty({ example: 'Invalid transaction', description: 'Error message if validation failed', required: false })
  error?: string;
}
