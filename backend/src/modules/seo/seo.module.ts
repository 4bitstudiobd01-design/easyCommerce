import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ReviewEntity } from '../catalog/entities/review.entity';
import { InventoryStockEntity } from '../inventory/entities/inventory-stock.entity';
import { StoreEntity } from '../tenant/entities/store.entity';
import { GetProductSeoService } from './services/get-product-seo.service';
import { GetStoreSeoService } from './services/get-store-seo.service';
import { SeoController } from './seo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity, ReviewEntity, InventoryStockEntity, StoreEntity]),
  ],
  controllers: [SeoController],
  providers: [GetProductSeoService, GetStoreSeoService],
  exports: [GetProductSeoService, GetStoreSeoService],
})
export class SeoModule {}
