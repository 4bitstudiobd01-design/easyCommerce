import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export type CategoryImportMode = 'CREATE_ONLY' | 'UPSERT';

export class ImportCategoriesDto {
  @ApiProperty({ description: 'Raw CSV text content' })
  @IsNotEmpty({ message: 'CSV content cannot be empty' })
  @IsString()
  csvContent: string;

  @ApiPropertyOptional({
    enum: ['CREATE_ONLY', 'UPSERT'],
    default: 'CREATE_ONLY',
    description: 'Import mode: CREATE_ONLY (skip existing slugs) or UPSERT (update existing slugs)',
  })
  @IsOptional()
  @IsEnum(['CREATE_ONLY', 'UPSERT'])
  mode?: CategoryImportMode;
}
