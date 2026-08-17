import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { BlogPostStatusEnum } from '../entities/blog-post.entity';

export class CreateBlogPostDto {
  @ApiProperty({ example: 'How to launch your first online store in Bangladesh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'launch-your-first-online-store',
    description: 'Derived from the title when omitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase words separated by single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'A practical guide for new merchants.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty({ example: 'Full post body...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'BitCommerce Team' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;

  @ApiPropertyOptional({ example: 'Product' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.webp' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImageUrl?: string;

  @ApiPropertyOptional({ enum: BlogPostStatusEnum, default: BlogPostStatusEnum.DRAFT })
  @IsOptional()
  @IsEnum(BlogPostStatusEnum)
  status?: BlogPostStatusEnum;
}
