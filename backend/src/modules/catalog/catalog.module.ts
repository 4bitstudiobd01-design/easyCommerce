import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoryEntity } from './entities/category.entity';
import { ProductEntity } from './entities/product.entity';
import { ProductVariantEntity } from './entities/product-variant.entity';
import { ProductImageEntity } from './entities/product-image.entity';
import { TenantModule } from '../tenant/tenant.module';
import { CreateCategoryService } from './services/create-category.service';
import { ListCategoriesService } from './services/list-categories.service';
import { CreateProductService } from './services/create-product.service';
import { ListProductsService } from './services/list-products.service';
import { FindProductByIdService } from './services/find-product-by-id.service';
import { CatalogController } from './catalog.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      ProductEntity,
      ProductVariantEntity,
      ProductImageEntity,
    ]),
    TenantModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [CatalogController],
  providers: [
    CreateCategoryService,
    ListCategoriesService,
    CreateProductService,
    ListProductsService,
    FindProductByIdService,
    JwtAuthGuard,
  ],
  exports: [
    CreateCategoryService,
    ListCategoriesService,
    CreateProductService,
    ListProductsService,
    FindProductByIdService,
    TypeOrmModule,
  ],
})
export class CatalogModule {}
