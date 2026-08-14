import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsignmentStatusEnum } from '../entities/consignment.entity';
import { ShipmentListItemDto } from './shipment-list-response.dto';

export class ShipmentTimelineEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ConsignmentStatusEnum })
  status: ConsignmentStatusEnum;

  @ApiProperty({ example: 'In Transit' })
  statusLabel: string;

  @ApiProperty()
  timestamp: Date;

  @ApiPropertyOptional({ example: 'Dhaka Hub' })
  location?: string;

  @ApiPropertyOptional({ example: 'Parcel arrived at the sorting hub' })
  description?: string;
}

export class ShipmentDetailsResponseDto extends ShipmentListItemDto {
  @ApiProperty({ example: 'Warehouse 3, Tejgaon I/A, Dhaka' })
  pickupAddress: string;

  @ApiProperty({ example: 'House 12, Road 5, Block B, Dhaka' })
  deliveryAddress: string;

  @ApiProperty({ example: 'PARCEL' })
  parcelType: string;

  @ApiPropertyOptional({ example: '20x15x10' })
  parcelDimensions?: string;

  @ApiProperty({ example: 60 })
  deliveryCharge: number;

  @ApiPropertyOptional()
  deliveryNote?: string;

  @ApiPropertyOptional()
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'When the courier reported the cash as collected' })
  codCollectedAt?: Date;

  @ApiPropertyOptional({ description: 'When the cash was remitted to the merchant' })
  codSettledAt?: Date;

  @ApiPropertyOptional({ description: 'Last time tracking was synced with the courier' })
  lastSyncAt?: Date;

  @ApiProperty({
    type: [ShipmentTimelineEventDto],
    description: 'Real recorded tracking events — empty when the courier has reported nothing yet',
  })
  timeline: ShipmentTimelineEventDto[];

  @ApiProperty({
    enum: ConsignmentStatusEnum,
    isArray: true,
    description: 'Status transitions currently permitted by the domain rules',
  })
  allowedTransitions: ConsignmentStatusEnum[];
}
