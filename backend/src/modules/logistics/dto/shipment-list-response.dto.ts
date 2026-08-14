import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CodStatusEnum,
  ConsignmentStatusEnum,
  CourierProviderEnum,
} from '../entities/consignment.entity';

export class ShipmentCustomerDto {
  @ApiPropertyOptional({ description: 'Customer record ID, when the order is linked to one' })
  id?: string;

  @ApiProperty({ example: 'Rahim Hossain' })
  name: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  phone?: string;
}

export class ShipmentListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'SHP-10245' })
  shipmentNumber: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ example: 'EC-1024' })
  orderNumber: string;

  @ApiProperty({ type: ShipmentCustomerDto })
  customer: ShipmentCustomerDto;

  @ApiProperty({ enum: CourierProviderEnum })
  courierProvider: CourierProviderEnum;

  @ApiProperty({ example: 'Steadfast' })
  courierName: string;

  @ApiPropertyOptional({
    example: 'SF123456789',
    description: 'Null until a courier accepts the booking',
  })
  trackingCode?: string | null;

  @ApiProperty({ example: 2500 })
  codAmount: number;

  @ApiProperty({ enum: CodStatusEnum })
  codStatus: CodStatusEnum;

  @ApiProperty({ example: 'Pending' })
  codStatusLabel: string;

  @ApiProperty({ example: 'BDT' })
  currency: string;

  @ApiProperty({ enum: ConsignmentStatusEnum })
  status: ConsignmentStatusEnum;

  @ApiProperty({ example: 'In Transit' })
  statusLabel: string;

  @ApiProperty({ example: 'Dhaka' })
  city: string;

  @ApiProperty({ example: 0.5 })
  parcelWeight: number;

  @ApiProperty({ description: 'Whether business rules currently permit cancellation' })
  isCancellable: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ShipmentPaginationMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class ShipmentListResponseDto {
  @ApiProperty({ type: [ShipmentListItemDto] })
  data: ShipmentListItemDto[];

  @ApiProperty({ type: ShipmentPaginationMetaDto })
  meta: ShipmentPaginationMetaDto;
}
