import { ApiProperty } from '@nestjs/swagger';

export class SeedShipmentDemoDataResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Successfully seeded realistic shipment demo records.' })
  message: string;

  @ApiProperty({ example: 120 })
  ordersCreated: number;

  @ApiProperty({ example: 120 })
  shipmentsCreated: number;

  @ApiProperty({ example: 480 })
  eventsCreated: number;
}
