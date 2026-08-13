import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ example: 'Summer Collection', description: 'Collection name' })
  @IsNotEmpty({ message: 'Collection name is required' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Curated products for summer season', description: 'Collection description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'summer-collection', description: 'Custom URL slug' })
  @IsOptional()
  @IsString()
  slug?: string;
}
