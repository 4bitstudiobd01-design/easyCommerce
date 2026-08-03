import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetProductSeoService } from './services/get-product-seo.service';
import { GetStoreSeoService } from './services/get-store-seo.service';

@ApiTags('Advanced SEO Schema & OpenGraph Cards')
@Controller('seo')
export class SeoController {
  constructor(
    private readonly getProductSeoService: GetProductSeoService,
    private readonly getStoreSeoService: GetStoreSeoService,
  ) {}

  @Get('public/store/:slug')
  @ApiOperation({ summary: 'Get storefront JSON-LD schema & OpenGraph card metadata' })
  @ApiResponse({ status: 200, description: 'Storefront SEO metadata' })
  async getStoreSeo(@Param('slug') slug: string) {
    return this.getStoreSeoService.execute(slug);
  }

  @Get('public/product/:productId')
  @ApiOperation({ summary: 'Get product Google schema.org/Product JSON-LD & OpenGraph metadata' })
  @ApiResponse({ status: 200, description: 'Product SEO & JSON-LD schema metadata' })
  async getProductSeo(@Param('productId') productId: string) {
    return this.getProductSeoService.execute(productId);
  }
}
