import { ApiProperty } from '@nestjs/swagger';

/**
 * REDX_OpenAPI_Integration_Spec.md §3.5 — one delivery area. `id` is what
 * `delivery_area_id` / `pickup_area_id` refer to on every other RedX endpoint.
 */
export class RedxAreaDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  postCode: number;

  @ApiProperty()
  divisionName: string;

  @ApiProperty()
  zoneId: number;
}
