import { ApiProperty } from '@nestjs/swagger';

export class InventoryKpiResponseDto {
  @ApiProperty({ description: 'Total tracked inventory items / products in the store', example: 1248 })
  totalItems: number;

  @ApiProperty({ description: 'Total physical units across all items in warehouse storage', example: 25430 })
  totalUnits: number;

  @ApiProperty({ description: 'Number of inventory items at or below their low stock threshold', example: 128 })
  lowStockCount: number;

  @ApiProperty({ description: 'Number of inventory items with 0 available units', example: 32 })
  outOfStockCount: number;

  @ApiProperty({ description: 'Number of inventory items with healthy stock levels', example: 1088 })
  inStockCount: number;
}
