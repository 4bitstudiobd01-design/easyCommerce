import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsArray, IsEmail } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Rahim Ahmed' })
  @IsNotEmpty()
  @IsString()
  reviewerName: string;

  @ApiProperty({ example: 'rahim@example.com', required: false })
  @IsOptional()
  @IsEmail()
  reviewerEmail?: string;

  @ApiProperty({ example: 'Excellent product! High quality and fast delivery.' })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty({ example: ['https://images.unsplash.com/...'], required: false })
  @IsOptional()
  @IsArray()
  images?: string[];
}
