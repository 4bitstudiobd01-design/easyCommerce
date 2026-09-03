import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCategoryService } from './services/create-category.service';
import { FindCategoryByIdService } from './services/find-category-by-id.service';
import { ListCategoriesService, CategoryListResult } from './services/list-categories.service';
import { GetCategoryKpisService } from './services/get-category-kpis.service';
import { ListParentCategoriesService } from './services/list-parent-categories.service';
import { GetCategoryTreeService, CategoryTreeNode } from './services/get-category-tree.service';
import { ReorderCategoryService } from './services/reorder-category.service';
import { UpdateCategoryService } from './services/update-category.service';
import { DeleteCategoryService } from './services/delete-category.service';
import { BulkUpdateCategoryStatusService, BulkCategoryStatusResult } from './services/bulk-update-category-status.service';
import { BulkMoveCategoriesService, BulkMoveCategoriesResult } from './services/bulk-move-categories.service';
import { BulkDeleteCategoriesService, BulkDeleteCategoriesResult } from './services/bulk-delete-categories.service';
import { ExportCategoriesService } from './services/export-categories.service';
import { ImportCategoriesService, CategoryImportPreviewResult, CategoryImportExecuteResult } from './services/import-categories.service';
import { CreateBrandService } from './services/create-brand.service';
import { ListBrandsService } from './services/list-brands.service';
import { DeleteBrandService } from './services/delete-brand.service';
import { CreateCollectionService } from './services/create-collection.service';
import { ListCollectionsService } from './services/list-collections.service';
import { DeleteCollectionService } from './services/delete-collection.service';

import { CreateAttributeService } from './services/create-attribute.service';
import { UpdateAttributeService, UpdateAttributeDto } from './services/update-attribute.service';
import { DeleteAttributeService } from './services/delete-attribute.service';
import { AddAttributeOptionService } from './services/add-attribute-option.service';
import { DeleteAttributeOptionService } from './services/delete-attribute-option.service';
import { ListAttributesService } from './services/list-attributes.service';
import { GetCategoryAttributesService } from './services/get-category-attributes.service';
import { AssignCategoryAttributesService } from './services/assign-category-attributes.service';
import { SetProductAttributeValuesService } from './services/set-product-attribute-values.service';
import { ListProductAttributeValuesService } from './services/list-product-attribute-values.service';

import { GenerateProductVariantsService } from './services/generate-product-variants.service';
import { UpdateProductVariantService } from './services/update-product-variant.service';
import { DeleteProductVariantService } from './services/delete-product-variant.service';
import { BulkUpdateVariantsService } from './services/bulk-update-variants.service';
import { BulkDeleteVariantsService } from './services/bulk-delete-variants.service';

import { CreateShippingProfileService, ListShippingProfilesService, CreateShippingProfileDto } from './services/shipping-profile.service';

import { BulkUpdateProductStatusService, BulkUpdateProductStatusDto, BulkStatusResult } from './services/bulk-update-product-status.service';
import { ExportProductsService } from './services/export-products.service';
import { ImportProductsService, ImportProductsDto, ImportProductsResult } from './services/import-products.service';

import { UpdateProductSeoService, UpdateProductSeoDto } from './services/update-product-seo.service';
import {
  AddRelatedProductService,
  RemoveRelatedProductService,
  ListRelatedProductsService,
  ReorderRelatedProductsService,
  AddRelatedProductDto,
  ReorderRelatedProductsDto,
} from './services/related-products.service';

import {
  GetProductAnalyticsService,
  ProductAnalyticsQueryDto,
  ProductAnalyticsSummaryResult,
  SalesTrendDataPoint,
  VariantAnalyticsBreakdown,
} from './services/product-analytics.service';

import { CreateProductService } from './services/create-product.service';
import { UpdateProductService } from './services/update-product.service';
import { DeleteProductService, DeleteProductResult } from './services/delete-product.service';
import {
  UploadProductMediaService,
  UploadedMediaResult,
  MAX_UPLOAD_BYTES,
} from './services/upload-product-media.service';
import { ListProductsService } from './services/list-products.service';
import { FindProductByIdService } from './services/find-product-by-id.service';
import { FindPublicStoreProductsService, PublicStoreProductsResponse } from './services/find-public-store-products.service';
import { FindPublicStoreProductBySlugService, PublicStoreProductResponse } from './services/find-public-store-product-by-slug.service';
import { FindPublicStoreCategoriesService, PublicStoreCategory } from './services/find-public-store-categories.service';
import { HomepageSection } from './enums/homepage-section.enum';
import { FindStoreByUserService } from '../tenant/services/find-store-by-user.service';
import { CreateReviewService } from './services/create-review.service';
import { ListProductReviewsService } from './services/list-product-reviews.service';
import { ModerateReviewService } from './services/moderate-review.service';
import { AddProductMediaService } from './services/add-product-media.service';
import { SetPrimaryProductMediaService } from './services/set-primary-product-media.service';
import { ReorderProductMediaService } from './services/reorder-product-media.service';
import { DeleteProductMediaService } from './services/delete-product-media.service';
import { ListProductMediaService } from './services/list-product-media.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryListDto } from './dto/category-list.dto';
import { CategoryKpisDto } from './dto/category-kpis.dto';
import { ReorderCategoryDto } from './dto/reorder-category.dto';
import { BulkUpdateCategoryStatusDto } from './dto/bulk-update-category-status.dto';
import { BulkMoveCategoriesDto } from './dto/bulk-move-categories.dto';
import { BulkDeleteCategoriesDto } from './dto/bulk-delete-categories.dto';
import { ImportCategoriesDto } from './dto/import-categories.dto';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { SetProductAttributeValuesDto } from './dto/set-product-attribute-values.dto';
import { GenerateProductVariantsDto } from './dto/generate-product-variants.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { BulkUpdateVariantsDto } from './dto/bulk-update-variants.dto';
import { BulkDeleteVariantsDto } from './dto/bulk-delete-variants.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductListDto } from './dto/product-list.dto';
import { ProductListResult } from './services/list-products.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AddProductMediaDto } from './dto/add-product-media.dto';
import { ReorderProductMediaDto } from './dto/reorder-product-media.dto';
import { ReorderProductsDto } from './dto/reorder-products.dto';
import { ReorderProductsService } from './services/reorder-products.service';

import { CategoryEntity } from './entities/category.entity';
import { BrandEntity } from './entities/brand.entity';
import { CollectionEntity } from './entities/collection.entity';
import { AttributeDefinitionEntity } from './entities/attribute-definition.entity';
import { ProductAttributeValueEntity } from './entities/product-attribute-value.entity';
import { ProductEntity } from './entities/product.entity';
import { ProductVariantEntity } from './entities/product-variant.entity';
import { ShippingProfileEntity } from './entities/shipping-profile.entity';
import { ProductRelationEntity } from './entities/product-relation.entity';
import { ReviewEntity } from './entities/review.entity';
import { ProductImageEntity } from './entities/product-image.entity';

@ApiTags('Catalog & Products')
@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly createCategoryService: CreateCategoryService,
    private readonly findCategoryByIdService: FindCategoryByIdService,
    private readonly listCategoriesService: ListCategoriesService,
    private readonly getCategoryKpisService: GetCategoryKpisService,
    private readonly listParentCategoriesService: ListParentCategoriesService,
    private readonly getCategoryTreeService: GetCategoryTreeService,
    private readonly reorderCategoryService: ReorderCategoryService,
    private readonly updateCategoryService: UpdateCategoryService,
    private readonly deleteCategoryService: DeleteCategoryService,
    private readonly bulkUpdateCategoryStatusService: BulkUpdateCategoryStatusService,
    private readonly bulkMoveCategoriesService: BulkMoveCategoriesService,
    private readonly bulkDeleteCategoriesService: BulkDeleteCategoriesService,
    private readonly exportCategoriesService: ExportCategoriesService,
    private readonly importCategoriesService: ImportCategoriesService,
    private readonly createBrandService: CreateBrandService,
    private readonly listBrandsService: ListBrandsService,
    private readonly deleteBrandService: DeleteBrandService,
    private readonly createCollectionService: CreateCollectionService,
    private readonly listCollectionsService: ListCollectionsService,
    private readonly deleteCollectionService: DeleteCollectionService,
    private readonly createAttributeService: CreateAttributeService,
    private readonly updateAttributeService: UpdateAttributeService,
    private readonly deleteAttributeService: DeleteAttributeService,
    private readonly addAttributeOptionService: AddAttributeOptionService,
    private readonly deleteAttributeOptionService: DeleteAttributeOptionService,
    private readonly listAttributesService: ListAttributesService,
    private readonly getCategoryAttributesService: GetCategoryAttributesService,
    private readonly assignCategoryAttributesService: AssignCategoryAttributesService,
    private readonly setProductAttributeValuesService: SetProductAttributeValuesService,
    private readonly listProductAttributeValuesService: ListProductAttributeValuesService,
    private readonly generateProductVariantsService: GenerateProductVariantsService,
    private readonly updateProductVariantService: UpdateProductVariantService,
    private readonly deleteProductVariantService: DeleteProductVariantService,
    private readonly bulkUpdateVariantsService: BulkUpdateVariantsService,
    private readonly bulkDeleteVariantsService: BulkDeleteVariantsService,
    private readonly createShippingProfileService: CreateShippingProfileService,
    private readonly listShippingProfilesService: ListShippingProfilesService,
    private readonly bulkUpdateProductStatusService: BulkUpdateProductStatusService,
    private readonly exportProductsService: ExportProductsService,
    private readonly importProductsService: ImportProductsService,
    private readonly updateProductSeoService: UpdateProductSeoService,
    private readonly addRelatedProductService: AddRelatedProductService,
    private readonly removeRelatedProductService: RemoveRelatedProductService,
    private readonly listRelatedProductsService: ListRelatedProductsService,
    private readonly reorderRelatedProductsService: ReorderRelatedProductsService,
    private readonly getProductAnalyticsService: GetProductAnalyticsService,
    private readonly createProductService: CreateProductService,
    private readonly updateProductService: UpdateProductService,
    private readonly deleteProductService: DeleteProductService,
    private readonly uploadProductMediaService: UploadProductMediaService,
    private readonly listProductsService: ListProductsService,
    private readonly findProductByIdService: FindProductByIdService,
    private readonly findPublicStoreProductsService: FindPublicStoreProductsService,
    private readonly findPublicStoreProductBySlugService: FindPublicStoreProductBySlugService,
    private readonly findPublicStoreCategoriesService: FindPublicStoreCategoriesService,
    private readonly findStoreByUserService: FindStoreByUserService,
    private readonly createReviewService: CreateReviewService,
    private readonly listProductReviewsService: ListProductReviewsService,
    private readonly moderateReviewService: ModerateReviewService,
    private readonly addProductMediaService: AddProductMediaService,
    private readonly setPrimaryProductMediaService: SetPrimaryProductMediaService,
    private readonly reorderProductMediaService: ReorderProductMediaService,
    private readonly deleteProductMediaService: DeleteProductMediaService,
    private readonly listProductMediaService: ListProductMediaService,
    private readonly reorderProductsService: ReorderProductsService,
  ) {}

  private async getMerchantTenantId(userId: string, storeId?: string): Promise<string> {
    const store = await this.findStoreByUserService.execute(userId, storeId);
    if (!store) {
      throw new BadRequestException('Merchant must create a store before managing catalog products.');
    }
    return store.tenantId;
  }

  // --- PUBLIC UNPROTECTED STOREFRONT ENDPOINTS ---

  @Get('public/store/:slug/products')
  @ApiOperation({ summary: 'Get public storefront details & products by store slug' })
  @ApiResponse({ status: 200, description: 'Storefront details and published catalog products' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getPublicStoreProducts(
    @Param('slug') slug: string,
    @Query('section') section?: HomepageSection,
  ): Promise<PublicStoreProductsResponse> {
    return this.findPublicStoreProductsService.execute(slug, section);
  }

  @Get('public/store/:slug/products/:productSlug')
  @ApiOperation({ summary: 'Get a single public product by slug for storefront PDP' })
  @ApiResponse({ status: 200, description: 'Store details and the requested product' })
  @ApiResponse({ status: 404, description: 'Store or product not found, unpublished, or hidden' })
  async getPublicStoreProductBySlug(
    @Param('slug') slug: string,
    @Param('productSlug') productSlug: string,
  ): Promise<PublicStoreProductResponse> {
    return this.findPublicStoreProductBySlugService.execute(slug, productSlug);
  }

  @Get('public/store/:slug/categories')
  @ApiOperation({ summary: 'Get storefront-visible categories for a store, in merchant-defined order' })
  @ApiResponse({ status: 200, description: 'Active, storefront-visible categories sorted by sortOrder' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getPublicStoreCategories(@Param('slug') slug: string): Promise<PublicStoreCategory[]> {
    return this.findPublicStoreCategoriesService.execute(slug);
  }

  @Post('products/:id/reviews')
  @ApiOperation({ summary: 'Submit a product review' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully, pending moderation' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createReview(
    @Param('id') productId: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewEntity> {
    return this.createReviewService.execute(productId, dto);
  }

  @Get('products/:id/reviews')
  @ApiOperation({ summary: 'Get approved reviews for a product' })
  @ApiResponse({ status: 200, description: 'List of approved reviews for the product' })
  async getApprovedReviews(@Param('id') productId: string) {
    return this.listProductReviewsService.listApprovedForProduct(productId);
  }

  // --- ATTRIBUTE DEFINITION & CATEGORY BINDING ENDPOINTS (CHUNK 6) ---

  @Post('attributes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an attribute definition with type safety & options' })
  @RequirePermissions('products:write')
  async createAttribute(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateAttributeDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<AttributeDefinitionEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.createAttributeService.execute(tenantId, dto);
  }

  @Post('attributes/:id/options')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new option to an existing attribute definition' })
  @RequirePermissions('products:write')
  async addAttributeOption(
    @CurrentUser('sub') userId: string,
    @Param('id') attributeId: string,
    @Body() dto: { label: string; value?: string; sortOrder?: number },
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.addAttributeOptionService.execute(attributeId, tenantId, dto);
  }

  @Put('attributes/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an attribute definition and its options' })
  @RequirePermissions('products:write')
  async updateAttribute(
    @CurrentUser('sub') userId: string,
    @Param('id') attributeId: string,
    @Body() dto: UpdateAttributeDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<AttributeDefinitionEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.updateAttributeService.execute(attributeId, tenantId, dto);
  }

  @Delete('attributes/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an attribute definition' })
  @RequirePermissions('products:write')
  async deleteAttribute(
    @CurrentUser('sub') userId: string,
    @Param('id') attributeId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteAttributeService.execute(attributeId, tenantId);
  }

  @Delete('attributes/options/:optionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a single attribute option' })
  @RequirePermissions('products:write')
  async deleteAttributeOption(
    @CurrentUser('sub') userId: string,
    @Param('optionId') optionId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteAttributeOptionService.execute(optionId, tenantId);
  }

  @Get('attributes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all attribute definitions for merchant store' })
  @RequirePermissions('products:read')
  async listAttributes(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<AttributeDefinitionEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listAttributesService.execute(tenantId);
  }

  @Get('categories/:id/attributes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attribute definitions assigned to a category (with parent inheritance)' })
  @RequirePermissions('products:read')
  async getCategoryAttributes(
    @CurrentUser('sub') userId: string,
    @Param('id') categoryId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<AttributeDefinitionEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getCategoryAttributesService.execute(categoryId, tenantId);
  }

  @Post('categories/:id/attributes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign attributes to a category' })
  @RequirePermissions('products:write')
  async assignCategoryAttributes(
    @CurrentUser('sub') userId: string,
    @Param('id') categoryId: string,
    @Body('attributeIds') attributeIds: string[],
    @Headers('x-store-id') storeId?: string,
  ): Promise<{ message: string; count: number }> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.assignCategoryAttributesService.execute(categoryId, tenantId, attributeIds);
  }

  @Post('products/:id/attributes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set/upsert product attribute values' })
  @RequirePermissions('products:write')
  async setProductAttributeValues(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: SetProductAttributeValuesDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductAttributeValueEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.setProductAttributeValuesService.execute(productId, tenantId, dto);
  }

  @Get('products/:id/attributes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List assigned attribute values for a product' })
  @RequirePermissions('products:read')
  async listProductAttributeValues(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductAttributeValueEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listProductAttributeValuesService.execute(productId, tenantId);
  }

  // --- PRODUCT VARIANTS ENDPOINTS (CHUNK 9) ---
  @Post('products/:id/variants/generate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Cartesian product variants for a product' })
  @RequirePermissions('products:write')
  async generateProductVariants(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: GenerateProductVariantsDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductVariantEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.generateProductVariantsService.execute(productId, tenantId, dto);
  }

  @Patch('products/:id/variants/bulk')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update selected variants for a product' })
  @RequirePermissions('products:write')
  async bulkUpdateVariants(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: BulkUpdateVariantsDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductVariantEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.bulkUpdateVariantsService.execute(productId, tenantId, dto);
  }

  @Post('products/:id/variants/bulk-delete')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete several variants of a product in one transaction' })
  @RequirePermissions('products:write')
  async bulkDeleteVariants(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: BulkDeleteVariantsDto,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.bulkDeleteVariantsService.execute(productId, tenantId, dto.variantIds);
  }

  @Patch('products/:id/variants/:variantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a single product variant' })
  @RequirePermissions('products:write')
  async updateProductVariant(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateProductVariantDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductVariantEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.updateProductVariantService.execute(productId, variantId, tenantId, dto);
  }

  @Delete('products/:id/variants/:variantId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a single product variant' })
  @RequirePermissions('products:write')
  async deleteProductVariant(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Headers('x-store-id') storeId?: string,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteProductVariantService.execute(productId, variantId, tenantId);
  }

  // --- SHIPPING PROFILES ENDPOINTS (CHUNK 10) ---
  @Get('shipping-profiles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List shipping profiles for merchant store' })
  @RequirePermissions('products:read')
  async listShippingProfiles(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShippingProfileEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listShippingProfilesService.execute(tenantId);
  }

  @Post('shipping-profiles')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new shipping profile for merchant store' })
  @RequirePermissions('products:write')
  async createShippingProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateShippingProfileDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ShippingProfileEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.createShippingProfileService.execute(tenantId, dto);
  }

  // --- PRODUCT OPERATIONS, BULK & IMPORT/EXPORT (CHUNK 11) ---
  @Patch('products/bulk/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update product status (DRAFT, ACTIVE, ARCHIVED)' })
  @RequirePermissions('products:write')
  async bulkUpdateProductStatus(
    @CurrentUser('sub') userId: string,
    @Body() dto: BulkUpdateProductStatusDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<BulkStatusResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.bulkUpdateProductStatusService.execute(tenantId, dto);
  }

  @Get('products/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export products to CSV format' })
  @RequirePermissions('products:read')
  async exportProducts(
    @CurrentUser('sub') userId: string,
    @Query() dto: ProductListDto,
    @Query('productIds') productIdsStr?: string,
    @Headers('x-store-id') storeId?: string,
    @Res() res?: Response,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const productIds = productIdsStr ? productIdsStr.split(',').filter(Boolean) : undefined;
    const csvData = await this.exportProductsService.execute(tenantId, dto, productIds);

    if (res) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="products_export.csv"');
      return res.send(csvData);
    }
    return csvData;
  }

  @Get('products/import/template')
  @ApiOperation({ summary: 'Download Product Import CSV Template' })
  async getImportTemplate(@Res() res: Response) {
    const csvContent = this.importProductsService.getImportTemplateCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="product_import_template.csv"');
    return res.send(csvContent);
  }

  @Post('products/import')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import products from CSV' })
  @RequirePermissions('products:write')
  async importProducts(
    @CurrentUser('sub') userId: string,
    @Body() dto: ImportProductsDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ImportProductsResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.importProductsService.execute(tenantId, dto);
  }

  // --- PRODUCT SEO & RELATED PRODUCTS ENDPOINTS (CHUNK 12) ---
  @Patch('products/:id/seo')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update SEO configuration and slug for a product' })
  @RequirePermissions('products:write')
  async updateProductSeo(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductSeoDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.updateProductSeoService.execute(productId, tenantId, dto);
  }

  @Get('products/:id/related')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List related products for a parent product' })
  @RequirePermissions('products:read')
  async listRelatedProducts(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductRelationEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listRelatedProductsService.execute(productId, tenantId);
  }

  @Post('products/:id/related')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a related product relationship' })
  @RequirePermissions('products:write')
  async addRelatedProduct(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: AddRelatedProductDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductRelationEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.addRelatedProductService.execute(productId, tenantId, dto);
  }

  @Delete('products/:id/related/:relatedProductId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a related product relationship' })
  @RequirePermissions('products:write')
  async removeRelatedProduct(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Param('relatedProductId') relatedProductId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<{ message: string }> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    await this.removeRelatedProductService.execute(productId, relatedProductId, tenantId);
    return { message: 'Related product relation removed successfully' };
  }

  // --- PRODUCT ANALYTICS & PERFORMANCE ENDPOINTS (CHUNK 13) ---
  @Get('products/:id/analytics/summary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get KPI sales summary and period comparisons for a product' })
  @RequirePermissions('analytics:read')
  async getProductAnalyticsSummary(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Query() query: ProductAnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductAnalyticsSummaryResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getProductAnalyticsService.getSummary(productId, tenantId, query);
  }

  @Get('products/:id/analytics/trend')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get daily sales time-series trend data for a product' })
  @RequirePermissions('analytics:read')
  async getProductAnalyticsTrend(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Query() query: ProductAnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<SalesTrendDataPoint[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getProductAnalyticsService.getSalesTrend(productId, tenantId, query);
  }

  @Get('products/:id/analytics/variants')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get variant sales performance breakdown for a product' })
  @RequirePermissions('analytics:read')
  async getProductAnalyticsVariants(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Query() query: ProductAnalyticsQueryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<VariantAnalyticsBreakdown[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getProductAnalyticsService.getVariantBreakdown(productId, tenantId, query);
  }

  @Patch('products/:id/related/reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder related products' })
  @RequirePermissions('products:write')
  async reorderRelatedProducts(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: ReorderRelatedProductsDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductRelationEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.reorderRelatedProductsService.execute(productId, tenantId, dto);
  }

  // --- CATEGORIES, BRANDS & COLLECTIONS ENDPOINTS ---

  @Post('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product category' })
  @RequirePermissions('products:write')
  async createCategory(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCategoryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.createCategoryService.execute(tenantId, dto);
  }

  @Get('categories/tree')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full hierarchical category tree with product counts' })
  @ApiResponse({ status: 200, description: 'Recursive category hierarchy tree' })
  @RequirePermissions('products:read')
  async getCategoryTree(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryTreeNode[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getCategoryTreeService.execute(tenantId);
  }

  @Post('categories/reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move or reorder category in hierarchy tree (atomic transaction)' })
  @ApiResponse({ status: 200, description: 'Updated category hierarchy tree' })
  @RequirePermissions('products:write')
  async reorderCategory(
    @CurrentUser('sub') userId: string,
    @Body() dto: ReorderCategoryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryTreeNode[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.reorderCategoryService.execute(tenantId, dto);
  }

  @Post('categories/media/upload')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('products:write')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload category image files (max 5MB each)' })
  @ApiResponse({ status: 201, description: 'Files stored; returns their public URLs' })
  @ApiResponse({ status: 400, description: 'Unsupported file type or file too large' })
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 5 },
    }),
  )
  async uploadCategoryMedia(
    @CurrentUser('sub') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Headers('x-store-id') storeId?: string,
  ): Promise<UploadedMediaResult[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.uploadProductMediaService.execute(tenantId, files);
  }

  @Get('categories/kpi')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Category KPI cards for logged-in merchant store' })
  @ApiResponse({ status: 200, type: CategoryKpisDto })
  @RequirePermissions('products:read')
  async getCategoryKpis(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryKpisDto> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.getCategoryKpisService.execute(tenantId);
  }

  @Get('categories/parents')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all root parent categories for category filter dropdown' })
  @ApiResponse({ status: 200, description: 'List of root parent categories' })
  @RequirePermissions('products:read')
  async listParentCategories(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listParentCategoriesService.execute(tenantId);
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all categories with pagination, search, status, parent filters, and product count' })
  @RequirePermissions('products:read')
  async listCategories(
    @CurrentUser('sub') userId: string,
    @Query() query: CategoryListDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryListResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listCategoriesService.execute(tenantId, query);
  }

  // --- CATEGORIES BULK & IMPORT/EXPORT ENDPOINTS (CHUNK 8) ---
  @Patch('categories/bulk/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update category status (DRAFT, ACTIVE, ARCHIVED)' })
  @RequirePermissions('products:write')
  async bulkUpdateCategoryStatus(
    @CurrentUser('sub') userId: string,
    @Body() dto: BulkUpdateCategoryStatusDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<BulkCategoryStatusResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.bulkUpdateCategoryStatusService.execute(tenantId, dto);
  }

  @Post('categories/bulk/move')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk move categories to a new parent or root level' })
  @RequirePermissions('products:write')
  async bulkMoveCategories(
    @CurrentUser('sub') userId: string,
    @Body() dto: BulkMoveCategoriesDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<BulkMoveCategoriesResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.bulkMoveCategoriesService.execute(tenantId, dto);
  }

  @Post('categories/bulk/delete')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete categories safely (unlinks subcategories and products)' })
  @RequirePermissions('products:write')
  async bulkDeleteCategories(
    @CurrentUser('sub') userId: string,
    @Body() dto: BulkDeleteCategoriesDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<BulkDeleteCategoriesResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.bulkDeleteCategoriesService.execute(tenantId, dto);
  }

  @Get('categories/export')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export categories to CSV format' })
  @RequirePermissions('products:read')
  async exportCategories(
    @CurrentUser('sub') userId: string,
    @Query() query: CategoryListDto,
    @Query('categoryIds') categoryIdsStr?: string,
    @Headers('x-store-id') storeId?: string,
    @Res() res?: Response,
  ) {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    const categoryIds = categoryIdsStr ? categoryIdsStr.split(',').filter(Boolean) : undefined;
    const csvData = await this.exportCategoriesService.execute(tenantId, query, categoryIds);

    if (res) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="categories_export.csv"');
      return res.send(csvData);
    }
    return csvData;
  }

  @Get('categories/import/template')
  @ApiOperation({ summary: 'Download Category Import CSV Template' })
  async getCategoryImportTemplate(@Res() res: Response) {
    const csvContent = this.importCategoriesService.getImportTemplateCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="category_import_template.csv"');
    return res.send(csvContent);
  }

  @Post('categories/import/preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate and preview categories CSV import without mutating database' })
  @RequirePermissions('products:write')
  async previewCategoryImport(
    @CurrentUser('sub') userId: string,
    @Body() dto: ImportCategoriesDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryImportPreviewResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.importCategoriesService.preview(tenantId, dto.csvContent);
  }

  @Post('categories/import')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import categories from CSV with topological transaction safety' })
  @RequirePermissions('products:write')
  async importCategories(
    @CurrentUser('sub') userId: string,
    @Body() dto: ImportCategoriesDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryImportExecuteResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.importCategoriesService.execute(tenantId, dto);
  }

  @Get('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single category by ID with parent and subcategory relations' })
  @RequirePermissions('products:read')
  async getCategoryById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.findCategoryByIdService.execute(id, tenantId);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category with circular parent reference check' })
  @RequirePermissions('products:write')
  async updateCategory(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CategoryEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.updateCategoryService.execute(id, tenantId, dto);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category safely (resets product categoryId to null)' })
  @RequirePermissions('products:write')
  async deleteCategory(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<{ message: string }> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteCategoryService.execute(id, tenantId);
  }

  @Post('brands')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a brand' })
  @RequirePermissions('products:write')
  async createBrand(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateBrandDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<BrandEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.createBrandService.execute(tenantId, dto);
  }

  @Get('brands')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all brands for merchant store' })
  @RequirePermissions('products:read')
  async listBrands(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<BrandEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listBrandsService.execute(tenantId);
  }

  @Delete('brands/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a brand safely (resets product brandId to null)' })
  @RequirePermissions('products:write')
  async deleteBrand(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<{ message: string }> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteBrandService.execute(id, tenantId);
  }

  @Post('collections')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a collection' })
  @RequirePermissions('products:write')
  async createCollection(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCollectionDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CollectionEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.createCollectionService.execute(tenantId, dto);
  }

  @Get('collections')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all collections for merchant store' })
  @RequirePermissions('products:read')
  async listCollections(
    @CurrentUser('sub') userId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<CollectionEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listCollectionsService.execute(tenantId);
  }

  @Delete('collections/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a collection' })
  @RequirePermissions('products:write')
  async deleteCollection(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<{ message: string }> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteCollectionService.execute(id, tenantId);
  }

  // --- PRODUCTS ENDPOINTS ---

  @Post('products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product entity' })
  @RequirePermissions('products:write')
  async createProduct(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateProductDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.createProductService.execute(tenantId, dto);
  }

  @Patch('products/reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set display order for a set of products (e.g. within a homepage section)' })
  @RequirePermissions('products:write')
  async reorderProducts(
    @CurrentUser('sub') userId: string,
    @Body() dto: ReorderProductsDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<{ message: string }> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    await this.reorderProductsService.execute(tenantId, dto);
    return { message: 'Product order updated' };
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product properties, organization, slug, or status' })
  @RequirePermissions('products:write')
  async updateProduct(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.updateProductService.execute(id, tenantId, dto);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all products for logged-in merchant store' })
  @RequirePermissions('products:read', 'inventory:read')
  async listProducts(
    @CurrentUser('sub') userId: string,
    @Query() queryDto: ProductListDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductListResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listProductsService.execute(tenantId, queryDto);
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product details by ID' })
  @RequirePermissions('products:read', 'inventory:read')
  async getProductById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.findProductByIdService.execute(id, tenantId);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (archived instead when it has order history)' })
  @ApiResponse({ status: 200, description: 'Product deleted, or archived when referenced by orders' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<DeleteProductResult> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteProductService.execute(id, tenantId);
  }

  // --- PRODUCT MEDIA ENDPOINTS ---

  @Post('media/upload')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products:write')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload product image files (max 10 files, 5MB each)' })
  @ApiResponse({ status: 201, description: 'Files stored; returns their public URLs' })
  @ApiResponse({ status: 400, description: 'Unsupported file type or file too large' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Held in memory so the service can validate type and size before anything
      // touches disk, and rejected uploads leave no partial files behind.
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 10 },
    }),
  )
  async uploadProductMedia(
    @CurrentUser('sub') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Query('productId') productId?: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<UploadedMediaResult[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.uploadProductMediaService.execute(tenantId, files, productId);
  }

  @Post('products/:id/media')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('products:write')
  async addProductMedia(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: AddProductMediaDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductImageEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.addProductMediaService.execute(productId, tenantId, dto);
  }

  @Get('products/:id/media')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('products:read')
  async listProductMedia(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductImageEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.listProductMediaService.execute(productId, tenantId);
  }

  @Patch('products/:id/media/:mediaId/primary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('products:write')
  async setPrimaryMedia(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Param('mediaId') mediaId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductImageEntity> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.setPrimaryProductMediaService.execute(productId, mediaId, tenantId);
  }

  @Patch('products/:id/media/reorder')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('products:write')
  async reorderProductMedia(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Body() dto: ReorderProductMediaDto,
    @Headers('x-store-id') storeId?: string,
  ): Promise<ProductImageEntity[]> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.reorderProductMediaService.execute(productId, tenantId, dto);
  }

  @Delete('products/:id/media/:mediaId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('products:write')
  async deleteProductMedia(
    @CurrentUser('sub') userId: string,
    @Param('id') productId: string,
    @Param('mediaId') mediaId: string,
    @Headers('x-store-id') storeId?: string,
  ): Promise<{ message: string }> {
    const tenantId = await this.getMerchantTenantId(userId, storeId);
    return this.deleteProductMediaService.execute(productId, mediaId, tenantId);
  }
}
