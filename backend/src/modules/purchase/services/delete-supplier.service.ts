import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupplierEntity } from '../entities/supplier.entity';
import { PurchaseOrderEntity } from '../entities/purchase-order.entity';
import { BillEntity } from '../entities/bill.entity';

/**
 * Hard-deletes a supplier. Blocked once the supplier has any purchase history — the merchant
 * is told to set it Inactive instead, so historical POs and bills keep a valid reference.
 */
@Injectable()
export class DeleteSupplierService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly supplierRepository: Repository<SupplierEntity>,
    @InjectRepository(PurchaseOrderEntity)
    private readonly purchaseOrderRepository: Repository<PurchaseOrderEntity>,
    @InjectRepository(BillEntity)
    private readonly billRepository: Repository<BillEntity>,
  ) {}

  async execute(
    storeId: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const supplier = await this.supplierRepository.findOne({ where: { id, storeId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found in this store.');
    }

    const [poCount, billCount] = await Promise.all([
      this.purchaseOrderRepository.count({ where: { storeId, supplierId: id } }),
      this.billRepository.count({ where: { storeId, supplierId: id } }),
    ]);
    if (poCount > 0 || billCount > 0) {
      throw new BadRequestException(
        'This supplier has purchase history and cannot be deleted. Set it to Inactive instead.',
      );
    }

    await this.supplierRepository.remove(supplier);
    return { success: true, message: 'Supplier deleted.' };
  }
}
