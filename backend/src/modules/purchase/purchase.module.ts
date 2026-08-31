import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SupplierEntity } from './entities/supplier.entity';
import { PurchaseOrderEntity } from './entities/purchase-order.entity';
import { PurchaseOrderLineEntity } from './entities/purchase-order-line.entity';
import { BillEntity } from './entities/bill.entity';
import { BillLineEntity } from './entities/bill-line.entity';
import { SupplierPaymentEntity } from './entities/supplier-payment.entity';
import { PurchaseCounterEntity } from './entities/purchase-counter.entity';
import { AccountMappingEntity } from '../accounting/entities/account-mapping.entity';
import { AccountingSettingsEntity } from '../accounting/entities/accounting-settings.entity';

import { TenantModule } from '../tenant/tenant.module';
import { StaffModule } from '../staff/staff.module';
import { AccountingModule } from '../accounting/accounting.module';
import { InventoryModule } from '../inventory/inventory.module';

import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { PurchaseController } from './purchase.controller';

import { AllocatePurchaseNumberService } from './services/allocate-purchase-number.service';
import { CreateSupplierService } from './services/create-supplier.service';
import { UpdateSupplierService } from './services/update-supplier.service';
import { DeleteSupplierService } from './services/delete-supplier.service';
import { ListSuppliersService } from './services/list-suppliers.service';
import { GetSupplierStatsService } from './services/get-supplier-stats.service';
import { CreatePurchaseOrderService } from './services/create-purchase-order.service';
import { UpdatePurchaseOrderService } from './services/update-purchase-order.service';
import { CancelPurchaseOrderService } from './services/cancel-purchase-order.service';
import { ReceivePurchaseOrderService } from './services/receive-purchase-order.service';
import { ListPurchaseOrdersService } from './services/list-purchase-orders.service';
import { GetPurchaseOrderService } from './services/get-purchase-order.service';
import { GetPurchaseOrderStatsService } from './services/get-purchase-order-stats.service';
import { PurchasePostingHelper } from './services/purchase-posting.helper';
import { CreateBillService } from './services/create-bill.service';
import { UpdateBillService } from './services/update-bill.service';
import { DeleteBillService } from './services/delete-bill.service';
import { ListBillsService } from './services/list-bills.service';
import { GetBillService } from './services/get-bill.service';
import { GetBillStatsService } from './services/get-bill-stats.service';
import { RecordSupplierPaymentService } from './services/record-supplier-payment.service';
import { ListSupplierPaymentsService } from './services/list-supplier-payments.service';
import { GetPurchaseOverviewService } from './services/get-purchase-overview.service';
import { SeedPurchaseDemoDataService } from './services/seed-purchase-demo-data.service';

/**
 * Purchase — suppliers, purchase orders, bills and supplier payments for a merchant store.
 *
 * Depends on TenantModule (store resolution) and StaffModule (GetMyPermissionsService, which
 * PermissionsGuard uses to resolve the caller's purchases:* permissions), mirroring how
 * AccountingModule / HrmModule are wired.
 *
 * PO receipt pushes stock in through InventoryModule's AdjustStockService; bill save and
 * supplier payment auto-post balanced entries through AccountingModule's
 * PostJournalEntryService (idempotent via sourceRef, gated by AccountingSettings.autoPostEnabled).
 * AccountMappingEntity / AccountingSettingsEntity are re-registered here read-only so the
 * posting services can resolve mapped GL accounts without widening AccountingModule's exports.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierEntity,
      PurchaseOrderEntity,
      PurchaseOrderLineEntity,
      BillEntity,
      BillLineEntity,
      SupplierPaymentEntity,
      PurchaseCounterEntity,
      AccountMappingEntity,
      AccountingSettingsEntity,
    ]),
    TenantModule,
    StaffModule,
    AccountingModule,
    InventoryModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'bitcommerce_jwt_secret_key_change_in_prod'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  controllers: [PurchaseController],
  providers: [
    AllocatePurchaseNumberService,
    CreateSupplierService,
    UpdateSupplierService,
    DeleteSupplierService,
    ListSuppliersService,
    GetSupplierStatsService,
    CreatePurchaseOrderService,
    UpdatePurchaseOrderService,
    CancelPurchaseOrderService,
    ReceivePurchaseOrderService,
    ListPurchaseOrdersService,
    GetPurchaseOrderService,
    GetPurchaseOrderStatsService,
    PurchasePostingHelper,
    CreateBillService,
    UpdateBillService,
    DeleteBillService,
    ListBillsService,
    GetBillService,
    GetBillStatsService,
    RecordSupplierPaymentService,
    ListSupplierPaymentsService,
    GetPurchaseOverviewService,
    SeedPurchaseDemoDataService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [SeedPurchaseDemoDataService],
})
export class PurchaseModule {}
