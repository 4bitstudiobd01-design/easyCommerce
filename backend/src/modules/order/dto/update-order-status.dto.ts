import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatusEnum } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatusEnum, example: OrderStatusEnum.CONFIRMED })
  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  orderStatus: OrderStatusEnum;

  @ApiProperty({ required: false, example: 'Customer requested cancellation' })
  @IsOptional()
  @IsString()
  reason?: string;
}
