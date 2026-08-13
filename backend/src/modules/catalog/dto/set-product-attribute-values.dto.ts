import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsUUID, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeValueItemDto {
  @ApiProperty({ example: 'attr-uuid-1', description: 'Attribute Definition ID' })
  @IsNotEmpty()
  @IsUUID()
  attributeId: string;

  @ApiProperty({ example: '16GB', description: 'Attribute value (string, number, boolean, or serialized array)' })
  @IsNotEmpty()
  value: any;
}

export class SetProductAttributeValuesDto {
  @ApiProperty({ type: [AttributeValueItemDto], description: 'List of attribute values to assign' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueItemDto)
  attributes: AttributeValueItemDto[];
}
