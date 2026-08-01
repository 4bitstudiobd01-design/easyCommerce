import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsUUID, IsOptional, IsString } from 'class-validator';
import { CourierProviderEnum } from '../entities/consignment.entity';

export class CreateCourierBookingDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ enum: CourierProviderEnum, example: CourierProviderEnum.STEADFAST })
  @IsEnum(CourierProviderEnum)
  @IsNotEmpty()
  courierProvider: CourierProviderEnum;

  @ApiProperty({ example: 'Handle with care fragile parcel', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
