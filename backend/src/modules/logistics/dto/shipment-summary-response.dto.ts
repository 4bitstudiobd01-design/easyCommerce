import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourierProviderEnum } from '../entities/consignment.entity';

export class ShipmentKpiMetricDto {
  @ApiProperty({ description: 'Count of shipments in the current period' })
  count: number;

  @ApiProperty({ description: 'Monetary value where the KPI tracks money, else 0' })
  amount: number;

  @ApiProperty({ description: 'Comparable figure from the preceding, equally-long period' })
  previous: number;

  @ApiPropertyOptional({
    description: 'Percentage change vs the previous period; null when there is no baseline',
    nullable: true,
  })
  changePercent: number | null;
}

export class ShipmentOverviewSliceDto {
  @ApiProperty({ example: 'Delivered' })
  label: string;

  @ApiProperty({ example: 456 })
  count: number;

  @ApiProperty({ example: 36.3 })
  percentage: number;
}

export class CourierPerformanceDto {
  @ApiProperty({ enum: CourierProviderEnum })
  provider: CourierProviderEnum;

  @ApiProperty({ example: 'Steadfast' })
  name: string;

  @ApiProperty({ description: 'Shipments handled in the period', example: 624 })
  deliveries: number;

  @ApiProperty({ description: 'Delivered as a share of concluded shipments', example: 92.4 })
  successRate: number;
}

export class CodSummaryDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  collected: number;

  @ApiProperty()
  pendingSettlement: number;

  @ApiProperty()
  returned: number;
}

export class ShipmentSummaryResponseDto {
  @ApiProperty({ type: ShipmentKpiMetricDto })
  totalShipments: ShipmentKpiMetricDto;

  @ApiProperty({ type: ShipmentKpiMetricDto })
  pending: ShipmentKpiMetricDto;

  @ApiProperty({ type: ShipmentKpiMetricDto })
  inTransit: ShipmentKpiMetricDto;

  @ApiProperty({ type: ShipmentKpiMetricDto })
  delivered: ShipmentKpiMetricDto;

  @ApiProperty({ type: ShipmentKpiMetricDto })
  returned: ShipmentKpiMetricDto;

  @ApiProperty({ type: ShipmentKpiMetricDto })
  codCollected: ShipmentKpiMetricDto;

  @ApiProperty({ type: ShipmentKpiMetricDto })
  codPending: ShipmentKpiMetricDto;

  @ApiProperty({ type: [ShipmentOverviewSliceDto] })
  overview: ShipmentOverviewSliceDto[];

  @ApiProperty({ description: 'Total shipments behind the overview donut' })
  overviewTotal: number;

  @ApiProperty({ type: [CourierPerformanceDto] })
  courierPerformance: CourierPerformanceDto[];

  @ApiProperty({
    type: CodSummaryDto,
    description: 'Always the current calendar month, independent of the table filters',
  })
  codSummary: CodSummaryDto;

  @ApiProperty({ example: 'BDT' })
  currency: string;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;
}
