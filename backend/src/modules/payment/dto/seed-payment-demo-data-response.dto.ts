import { ApiProperty } from '@nestjs/swagger';

export class SeedPaymentDemoDataResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Successfully seeded realistic payment demo records.' })
  message: string;

  @ApiProperty({ example: 4 })
  gatewaysCreated: number;

  @ApiProperty({ example: 60 })
  ordersCreated: number;

  @ApiProperty({ example: 60 })
  paymentsCreated: number;

  @ApiProperty({ example: 8 })
  refundsCreated: number;

  @ApiProperty({ example: 180 })
  eventsCreated: number;
}
