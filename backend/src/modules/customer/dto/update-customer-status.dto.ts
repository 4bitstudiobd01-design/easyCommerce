import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { CustomerStatusEnum } from '../entities/customer.entity';

export class UpdateCustomerStatusDto {
  @ApiProperty({ enum: CustomerStatusEnum, example: CustomerStatusEnum.ACTIVE })
  @IsNotEmpty()
  @IsEnum(CustomerStatusEnum)
  status: CustomerStatusEnum;
}
