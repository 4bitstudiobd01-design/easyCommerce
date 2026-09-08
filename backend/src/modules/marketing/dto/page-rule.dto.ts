import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PixelRuleMatchTypeEnum,
  StorefrontPageTypeEnum,
} from '../entities/marketing-pixel-page-rule.entity';

export class PageRuleInputDto {
  @ApiProperty({ enum: PixelRuleMatchTypeEnum })
  @IsEnum(PixelRuleMatchTypeEnum)
  matchType: PixelRuleMatchTypeEnum;

  @ApiPropertyOptional({ enum: StorefrontPageTypeEnum, description: 'Required when matchType = PAGE_TYPE' })
  @IsOptional()
  @IsEnum(StorefrontPageTypeEnum)
  pageType?: StorefrontPageTypeEnum;

  @ApiPropertyOptional({ description: 'Required when matchType = URL_PATTERN, e.g. /product/clearance-*' })
  @IsOptional()
  @IsString()
  urlPattern?: string;

  @ApiPropertyOptional({ default: true, description: 'false = an exclusion that overrides matching includes' })
  @IsOptional()
  @IsBoolean()
  include?: boolean;
}

export class ReplacePageRulesDto {
  @ApiProperty({ type: [PageRuleInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageRuleInputDto)
  rules: PageRuleInputDto[];
}
