import { ApiProperty } from '@nestjs/swagger';

export class PathaoCityDto {
  @ApiProperty()
  cityId: number;

  @ApiProperty()
  cityName: string;
}

export class PathaoZoneDto {
  @ApiProperty()
  zoneId: number;

  @ApiProperty()
  zoneName: string;
}

export class PathaoAreaDto {
  @ApiProperty()
  areaId: number;

  @ApiProperty()
  areaName: string;

  @ApiProperty()
  homeDeliveryAvailable: boolean;

  @ApiProperty()
  pickupAvailable: boolean;
}
