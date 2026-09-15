import { ApiProperty } from '@nestjs/swagger';

export class SeedInventoryDemoDataResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Successfully seeded realistic inventory demo records.' })
  message: string;

  @ApiProperty({ example: 12 })
  productsCreated: number;

  @ApiProperty({ example: 28 })
  variantsCreated: number;

  @ApiProperty({ example: 28 })
  inventoryStocksCreated: number;

  @ApiProperty({ example: 84 })
  movementsCreated: number;
}
