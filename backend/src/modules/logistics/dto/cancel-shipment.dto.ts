import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelShipmentDto {
  @ApiPropertyOptional({
    description: 'Why the shipment is being cancelled; recorded on the timeline',
    example: 'Customer changed their mind before pickup',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
