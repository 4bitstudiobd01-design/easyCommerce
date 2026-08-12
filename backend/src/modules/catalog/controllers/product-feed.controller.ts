import { Controller, Get, Param, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ProductFeedService } from '../services/product-feed.service';

@ApiTags('Catalog Marketing Feeds')
@Controller('stores/slug')
export class ProductFeedController {
  constructor(private readonly productFeedService: ProductFeedService) {}

  @Get(':slug/feed/google-shopping.xml')
  @ApiOperation({ summary: 'Generate Google Shopping XML RSS Product Feed' })
  @ApiResponse({ status: 200, description: 'Google Shopping RSS XML feed of published products' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @Header('Content-Type', 'application/xml')
  async getGoogleShoppingFeed(
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    const xml = await this.productFeedService.generateGoogleShoppingXml(slug);
    res.setHeader('Content-Type', 'application/xml');
    return res.send(xml);
  }

  @Get(':slug/feed/facebook-catalog.csv')
  @ApiOperation({ summary: 'Generate Facebook Commerce Catalog CSV Product Feed' })
  @ApiResponse({ status: 200, description: 'Facebook Commerce Catalog CSV feed of published products' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  @Header('Content-Type', 'text/csv')
  async getFacebookCatalogFeed(
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    const csv = await this.productFeedService.generateFacebookCatalogCsv(slug);
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  }
}
