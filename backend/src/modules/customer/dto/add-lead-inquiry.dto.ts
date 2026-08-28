import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddLeadInquiryDto {
  @ApiProperty({ description: 'Detailed inquiry note / customer requirements discussed' })
  @IsNotEmpty()
  @IsString()
  note: string;

  @ApiPropertyOptional({ description: 'Name of the staff / manager / admin who inquired' })
  @IsOptional()
  @IsString()
  authorName?: string;

  @ApiPropertyOptional({ description: 'Role of the staff (e.g. Admin, Store Manager, Sales Rep)' })
  @IsOptional()
  @IsString()
  authorRole?: string;
}
