import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoryEntity } from './entities/category.entity';
import { BrandEntity } from './entities/brand.entity';
import { CollectionEntity } from './entities/collection.entity';
import { AttributeDefinitionEntity } from './entities/attribute-definition.entity';
import { AttributeOptionEntity } from './entities/attribute-option.entity';
import { CategoryAttributeEntity } from './entities/category-attribute.entity';
import { ProductAttributeValueEntity } from './entities/product-attribute-value.entity';
import { ProductEntity } from './entities/product.entity';
import { ProductVariantEntity } from './entities/product-variant.entity';
import { ShippingProfileEntity } from './entities/shipping-profile.entity';
import { ProductRelationEntity } from './entities/product-relation.entity';
import { ProductImageEntity } from './entities/product-image.entity';
import { ReviewEntity } from './entities/review.entity';
import { InventoryStockEntity } from '../inventory/entities/inventory-stock.entity';
import { InventoryMovementEntity } from '../inventory/entities/inventory-movement.entity';
import { WarehouseEntity } from '../inventory/entities/warehouse.entity';
import { OrderEntity } from '../order/entities/order.entity';
import { OrderItemEntity } from '../order/entities/order-item.entity';
import { TenantModule } from '../tenant/tenant.module';
import { StaffModule } from '../staff/staff.module';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateCategoryService } from './services/create-category.service';
import { FindCategoryByIdService } from './services/find-category-by-id.service';
import { ListCategoriesService } from './services/list-categories.service';
import { GetCategoryKpisService } from './services/get-category-kpis.service';
import { ListParentCategoriesService } from './services/list-parent-categories.service';
import { GetCategoryTreeService } from './services/get-category-tree.service';
import { ReorderCategoryService } from './services/reorder-category.service';
import { UpdateCategoryService } from './services/update-category.service';
import { DeleteCategoryService } from './services/delete-category.service';
import { BulkUpdateCategoryStatusService } from './services/bulk-update-category-status.service';
import { BulkMoveCategoriesService } from './services/bulk-move-categories.service';
import { BulkDeleteCategoriesService } from './services/bulk-delete-categories.service';
import { ExportCategoriesService } from './services/export-categories.service';
import { ImportCategoriesService } from './services/import-categories.service';
import { CreateBrandService } from './services/create-brand.service';
import { ListBrandsService } from './services/list-brands.service';
import { DeleteBrandService } from './services/delete-brand.service';
import { CreateCollectionService } from './services/create-collection.service';
import { ListCollectionsService } from './services/list-collections.service';
import { DeleteCollectionService } from './services/delete-collection.service';

import { CreateAttributeService } from './services/create-attribute.service';
import { ListAttributesService } from './services/list-attributes.service';
import { GetCategoryAttributesService } from './services/get-category-attributes.service';
import { AssignCategoryAttributesService } from './services/assign-category-attributes.service';
import { SetProductAttributeValuesService } from './services/set-product-attribute-values.service';
import { ListProductAttributeValuesService } from './services/list-product-attribute-values.service';

import { GenerateProductVariantsService } from './services/generate-product-variants.service';
import { UpdateProductVariantService } from './services/update-product-variant.service';
import { BulkUpdateVariantsService } from './services/bulk-update-variants.service';

import { CreateShippingProfileService, ListShippingProfilesService } from './services/shipping-profile.service';

import { BulkUpdateProductStatusService } from './services/bulk-update-product-status.service';
import { ExportProductsService } from './services/export-products.service';
import { ImportProductsService } from './services/import-products.service';

import { UpdateProductSeoService } from './services/update-product-seo.service';
import {
  AddRelatedProductService,
  RemoveRelatedProductService,
  ListRelatedProductsService,
  ReorderRelatedProductsService,
} from './services/related-products.service';

import { GetProductAnalyticsService } from './services/product-analytics.service';

import { ProductPricingCalculatorService } from './services/product-pricing-calculator.service';
import { CreateProductService } from './services/create-product.service';
import { UpdateProductService } from './services/update-product.service';
import { DeleteProductService } from './services/delete-product.service';
import { UploadProductMediaService } from './services/upload-product-media.service';
import { ListProductsService } from './services/list-products.service';
import { FindProductByIdService } from './services/find-product-by-id.service';
import { FindPublicStoreProductsService } from './services/find-public-store-products.service';
import { ProductSlugService } from './services/product-slug.service';
import { ProductFeedService } from './services/product-feed.service';
import { CreateReviewService } from './services/create-review.service';
import { ListProductReviewsService } from './services/list-product-reviews.service';
import { ModerateReviewService } from './services/moderate-review.service';
import { AddProductMediaService } from './services/add-product-media.service';
import { SetPrimaryProductMediaService } from './services/set-primary-product-media.service';
import { ReorderProductMediaService } from './services/reorder-product-media.service';
import { DeleteProductMediaService } from './services/delete-product-media.service';
import { ListProductMediaService } from './services/list-product-media.service';

import { CatalogController } from './catalog.controller';
import { ProductFeedController } from './controllers/product-feed.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      BrandEntity,
      CollectionEntity,
      AttributeDefinitionEntity,
      AttributeOptionEntity,
      CategoryAttributeEntity,
      ProductAttributeValueEntity,
      ProductEntity,
      ProductVariantEntity,
      ShippingProfileEntity,
      ProductRelationEntity,
      ProductImageEntity,
      ReviewEntity,
      InventoryStockEntity,
      InventoryMovementEntity,
      WarehouseEntity,
      OrderEntity,
      OrderItemEntity,
    ]),
    TenantModule,
    // Provides GetMyPermissionsService, the source of truth PermissionsGuard uses to
    // resolve a caller's staff permissions for the catalog endpoints.
    StaffModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [CatalogController, ProductFeedController],
  providers: [
    CreateCategoryService,
    FindCategoryByIdService,
    ListCategoriesService,
    GetCategoryKpisService,
    ListParentCategoriesService,
    GetCategoryTreeService,
    ReorderCategoryService,
    UpdateCategoryService,
    DeleteCategoryService,
    BulkUpdateCategoryStatusService,
    BulkMoveCategoriesService,
    BulkDeleteCategoriesService,
    ExportCategoriesService,
    ImportCategoriesService,
    CreateBrandService,
    ListBrandsService,
    DeleteBrandService,
    CreateCollectionService,
    ListCollectionsService,
    DeleteCollectionService,
    CreateAttributeService,
    ListAttributesService,
    GetCategoryAttributesService,
    AssignCategoryAttributesService,
    SetProductAttributeValuesService,
    ListProductAttributeValuesService,
    GenerateProductVariantsService,
    UpdateProductVariantService,
    BulkUpdateVariantsService,
    CreateShippingProfileService,
    ListShippingProfilesService,
    BulkUpdateProductStatusService,
    ExportProductsService,
    ImportProductsService,
    UpdateProductSeoService,
    AddRelatedProductService,
    RemoveRelatedProductService,
    ListRelatedProductsService,
    ReorderRelatedProductsService,
    GetProductAnalyticsService,
    ProductPricingCalculatorService,
    CreateProductService,
    UpdateProductService,
    DeleteProductService,
    UploadProductMediaService,
    ListProductsService,
    FindProductByIdService,
    FindPublicStoreProductsService,
    ProductSlugService,
    ProductFeedService,
    CreateReviewService,
    ListProductReviewsService,
    ModerateReviewService,
    AddProductMediaService,
    SetPrimaryProductMediaService,
    ReorderProductMediaService,
    DeleteProductMediaService,
    ListProductMediaService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [
    CreateCategoryService,
    FindCategoryByIdService,
    ListCategoriesService,
    GetCategoryKpisService,
    ListParentCategoriesService,
    GetCategoryTreeService,
    ReorderCategoryService,
    UpdateCategoryService,
    DeleteCategoryService,
    BulkUpdateCategoryStatusService,
    BulkMoveCategoriesService,
    BulkDeleteCategoriesService,
    ExportCategoriesService,
    ImportCategoriesService,
    CreateBrandService,
    ListBrandsService,
    DeleteBrandService,
    CreateCollectionService,
    ListCollectionsService,
    DeleteCollectionService,
    CreateAttributeService,
    ListAttributesService,
    GetCategoryAttributesService,
    AssignCategoryAttributesService,
    SetProductAttributeValuesService,
    ListProductAttributeValuesService,
    GenerateProductVariantsService,
    UpdateProductVariantService,
    BulkUpdateVariantsService,
    CreateShippingProfileService,
    ListShippingProfilesService,
    BulkUpdateProductStatusService,
    ExportProductsService,
    ImportProductsService,
    UpdateProductSeoService,
    AddRelatedProductService,
    RemoveRelatedProductService,
    ListRelatedProductsService,
    ReorderRelatedProductsService,
    ProductPricingCalculatorService,
    CreateProductService,
    UpdateProductService,
    ListProductsService,
    FindProductByIdService,
    FindPublicStoreProductsService,
    ProductSlugService,
    ProductFeedService,
    CreateReviewService,
    ListProductReviewsService,
    ModerateReviewService,
    AddProductMediaService,
    SetPrimaryProductMediaService,
    ReorderProductMediaService,
    DeleteProductMediaService,
    ListProductMediaService,
    TypeOrmModule,
  ],
})
export class CatalogModule {}
