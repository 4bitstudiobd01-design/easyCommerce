import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WarehouseEntity } from './entities/warehouse.entity';
import { InventoryStockEntity } from './entities/inventory-stock.entity';
import { InventoryMovementEntity } from './entities/inventory-movement.entity';
import { StockTransferEntity } from './entities/stock-transfer.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ProductVariantEntity } from '../catalog/entities/product-variant.entity';
import { TenantModule } from '../tenant/tenant.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CreateWarehouseService } from './services/create-warehouse.service';
import { ListWarehousesService } from './services/list-warehouses.service';
import { AdjustStockService } from './services/adjust-stock.service';
import { GetInventoryStockService } from './services/get-inventory-stock.service';
import { ListStockMovementsService } from './services/list-stock-movements.service';
import { StockTransferService } from './services/stock-transfer.service';
import { InventoryDomainService } from './services/inventory-domain.service';
import { ListInventoryService } from './services/list-inventory.service';
import { GetInventoryKpisService } from './services/get-inventory-kpis.service';
import { GetInventoryDetailsService } from './services/get-inventory-details.service';
import { ListInventoryHistoryService } from './services/list-inventory-history.service';
import { GetProductVariantInventoryService } from './services/get-product-variant-inventory.service';
import { BulkAdjustStockService } from './services/bulk-adjust-stock.service';
import { GetInventorySettingsOverviewService } from './services/get-inventory-settings-overview.service';
import { SeedInventoryDemoDataService } from './services/seed-inventory-demo-data.service';
import { InventoryController } from './inventory.controller';
import { StockTransferController } from './controllers/stock-transfer.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WarehouseEntity,
      InventoryStockEntity,
      InventoryMovementEntity,
      StockTransferEntity,
      ProductEntity,
      ProductVariantEntity,
    ]),
    TenantModule,
    CatalogModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'easycommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [InventoryController, StockTransferController],
  providers: [
    CreateWarehouseService,
    ListWarehousesService,
    AdjustStockService,
    BulkAdjustStockService,
    GetInventoryStockService,
    ListStockMovementsService,
    StockTransferService,
    InventoryDomainService,
    ListInventoryService,
    GetInventoryKpisService,
    GetInventoryDetailsService,
    ListInventoryHistoryService,
    GetProductVariantInventoryService,
    GetInventorySettingsOverviewService,
    SeedInventoryDemoDataService,
    JwtAuthGuard,
  ],
  exports: [
    CreateWarehouseService,
    ListWarehousesService,
    AdjustStockService,
    BulkAdjustStockService,
    GetInventoryStockService,
    ListStockMovementsService,
    StockTransferService,
    InventoryDomainService,
    ListInventoryService,
    GetInventoryKpisService,
    GetInventoryDetailsService,
    ListInventoryHistoryService,
    GetProductVariantInventoryService,
    GetInventorySettingsOverviewService,
    SeedInventoryDemoDataService,
    TypeOrmModule,
  ],
})
export class InventoryModule {}





