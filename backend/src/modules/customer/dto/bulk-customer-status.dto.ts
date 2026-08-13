import { IsArray, IsEnum, IsNotEmpty, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerStatusEnum } from '../entities/customer.entity';

export class BulkCustomerStatusDto {
  @ApiProperty({ description: 'Array of customer IDs to update', example: ['cust-uuid-1', 'cust-uuid-2'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  customerIds: string[];

  @ApiProperty({ enum: CustomerStatusEnum, description: 'Target customer status', example: CustomerStatusEnum.BLOCKED })
  @IsNotEmpty()
  @IsEnum(CustomerStatusEnum)
  status: CustomerStatusEnum;
}
