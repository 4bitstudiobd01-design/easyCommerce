import { ApiProperty } from '@nestjs/swagger';

export class InventoryDataOverviewDto {
  @ApiProperty({ example: 45 })
  totalProducts: number;

  @ApiProperty({ example: 120 })
  totalVariants: number;

  @ApiProperty({ example: 125 })
  totalInventoryItems: number;

  @ApiProperty({ example: 98 })
  inStockItems: number;

  @ApiProperty({ example: 15 })
  lowStockItems: number;

  @ApiProperty({ example: 12 })
  outOfStockItems: number;

  @ApiProperty({ example: 340 })
  totalMovements: number;
}

export class InventoryDataIntegrityViolationDto {
  @ApiProperty({ example: 's1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  inventoryId: string;

  @ApiProperty({ example: 'INVALID_AVAILABLE_STOCK' })
  type: string;

  @ApiProperty({ example: 'Calculated available stock is negative or mismatched.' })
  message: string;
}

export class InventoryDataIntegrityDto {
  @ApiProperty({ example: 'HEALTHY', enum: ['HEALTHY', 'DEGRADED'] })
  status: 'HEALTHY' | 'DEGRADED';

  @ApiProperty({ example: 0 })
  violationCount: number;

  @ApiProperty({ type: [InventoryDataIntegrityViolationDto] })
  violations: InventoryDataIntegrityViolationDto[];
}

export class InventorySecurityGuaranteesDto {
  @ApiProperty({ example: true, description: 'Locked invariant: negative stock disallowed' })
  stockValidationEnabled: boolean;

  @ApiProperty({ example: true, description: 'Locked invariant: immutable movement ledger tracking' })
  auditLogEnabled: boolean;

  @ApiProperty({ example: true, description: 'Locked invariant: row-level multi-tenant isolation' })
  tenantIsolationEnabled: boolean;

  @ApiProperty({ example: true, description: 'Locked invariant: real-time stock status computation' })
  autoStatusUpdateEnabled: boolean;

  @ApiProperty({ example: true, description: 'Atomic multi-item stock adjustments enabled' })
  bulkOperationsEnabled: boolean;
}

export class InventorySettingsOverviewResponseDto {
  @ApiProperty({ type: InventoryDataOverviewDto })
  overview: InventoryDataOverviewDto;

  @ApiProperty({ type: InventoryDataIntegrityDto })
  integrity: InventoryDataIntegrityDto;

  @ApiProperty({ type: InventorySecurityGuaranteesDto })
  securityGuarantees: InventorySecurityGuaranteesDto;
}
