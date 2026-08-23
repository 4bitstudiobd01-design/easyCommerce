import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UndoCollectCodDto {
  @ApiProperty({ example: 'Marked as collected by mistake' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
