import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WarehouseEntity } from './entities/warehouse.entity';
import { InventoryStockEntity } from './entities/inventory-stock.entity';
import { StockTransferEntity } from './entities/stock-transfer.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { TenantModule } from '../tenant/tenant.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CreateWarehouseService } from './services/create-warehouse.service';
import { ListWarehousesService } from './services/list-warehouses.service';
import { AdjustStockService } from './services/adjust-stock.service';
import { GetInventoryStockService } from './services/get-inventory-stock.service';
import { StockTransferService } from './services/stock-transfer.service';
import { InventoryController } from './inventory.controller';
import { StockTransferController } from './controllers/stock-transfer.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WarehouseEntity,
      InventoryStockEntity,
      StockTransferEntity,
      ProductEntity,
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
    GetInventoryStockService,
    StockTransferService,
    JwtAuthGuard,
  ],
  exports: [
    CreateWarehouseService,
    ListWarehousesService,
    AdjustStockService,
    GetInventoryStockService,
    StockTransferService,
    TypeOrmModule,
  ],
})
export class InventoryModule {}
