import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCategoryService } from './services/create-category.service';
import { ListCategoriesService } from './services/list-categories.service';
import { CreateProductService } from './services/create-product.service';
import { ListProductsService } from './services/list-products.service';
import { FindProductByIdService } from './services/find-product-by-id.service';
import { FindPublicStoreProductsService, PublicStoreProductsResponse } from './services/find-public-store-products.service';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';

@ApiTags('Catalog & Products')
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly createCategoryService: CreateCategoryService,
    private readonly listCategoriesService: ListCategoriesService,
    private readonly createProductService: CreateProductService,
    private readonly listProductsService: ListProductsService,
    private readonly findProductByIdService: FindProductByIdService,
    private readonly findPublicStoreProductsService: FindPublicStoreProductsService,
    private readonly findStoreByUserService: FindStoreByUserService,
  ) {}

  private async getMerchantTenantId(userId: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing catalog products.');
    }
    return store.tenantId;
  }

  // --- PUBLIC UNPROTECTED STOREFRONT ENDPOINTS ---

  @Get('public/store/:slug/products')
  @ApiOperation({ summary: 'Get public storefront details & products by store slug' })
  @ApiResponse({ status: 200, description: 'Storefront details and published catalog products' })
  async getPublicStoreProducts(@Param('slug') slug: string): Promise<PublicStoreProductsResponse> {
    return this.findPublicStoreProductsService.execute(slug);
  }

  // --- PROTECTED MERCHANT DASHBOARD ENDPOINTS ---

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async createCategory(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryEntity> {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.createCategoryService.execute(tenantId, dto);
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all categories for logged-in merchant store' })
  @ApiResponse({ status: 200, description: 'List of store categories' })
  async listCategories(@CurrentUser('sub') userId: string): Promise<CategoryEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.listCategoriesService.execute(tenantId);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product with default variant and image' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateProductDto,
  ): Promise<ProductEntity> {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.createProductService.execute(tenantId, dto);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all products for logged-in merchant store' })
  @ApiResponse({ status: 200, description: 'List of merchant products' })
  async listProducts(@CurrentUser('sub') userId: string): Promise<ProductEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.listProductsService.execute(tenantId);
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  async getProductById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Promise<ProductEntity> {
    const tenantId = await this.getMerchantTenantId(userId);
    return this.findProductByIdService.execute(id, tenantId);
  }
}
