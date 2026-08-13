import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerNoteDto {
  @ApiProperty({ description: 'Internal merchant note content' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;
}
