import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class ReorderProductMediaDto {
  @ApiProperty({ example: ['img-uuid-1', 'img-uuid-2'], description: 'Ordered list of media IDs' })
  @IsArray({ message: 'mediaIds must be an array' })
  @ArrayNotEmpty({ message: 'mediaIds cannot be empty' })
  @IsUUID('4', { each: true, message: 'Each item in mediaIds must be a valid UUID' })
  mediaIds: string[];
}
