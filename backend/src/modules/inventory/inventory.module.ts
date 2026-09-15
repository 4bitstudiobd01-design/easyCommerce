import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WarehouseEntity } from './entities/warehouse.entity';
import { InventoryStockEntity } from './entities/inventory-stock.entity';
import { InventoryMovementEntity } from './entities/inventory-movement.entity';
import { StockTransferEntity } from './entities/stock-transfer.entity';
import { BranchStockEntity } from './entities/branch-stock.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ProductVariantEntity } from '../catalog/entities/product-variant.entity';
import { BranchEntity } from '../tenant/entities/branch.entity';
import { TenantModule } from '../tenant/tenant.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CreateWarehouseService } from './services/create-warehouse.service';
import { ListWarehousesService } from './services/list-warehouses.service';
import { UpdateWarehouseService } from './services/update-warehouse.service';
import { DeleteWarehouseService } from './services/delete-warehouse.service';
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
      BranchStockEntity,
      ProductEntity,
      ProductVariantEntity,
      BranchEntity,
    ]),
    TenantModule,
    CatalogModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  // StockTransferController must be registered before InventoryController:
  // InventoryController's GET /inventory/:id wildcard would otherwise shadow
  // StockTransferController's more specific /inventory/transfers/* routes,
  // since Nest matches routes across controllers in registration order.
  controllers: [StockTransferController, InventoryController],
  providers: [
    CreateWarehouseService,
    ListWarehousesService,
    UpdateWarehouseService,
    DeleteWarehouseService,
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
    JwtAuthGuard,
  ],
  exports: [
    CreateWarehouseService,
    ListWarehousesService,
    UpdateWarehouseService,
    DeleteWarehouseService,
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
    TypeOrmModule,
  ],
})
export class InventoryModule {}





