import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateBillService } from './create-bill.service';

/**
 * A Bill can optionally link to the Purchase Order it was raised against
 * (Bill.purchaseOrderId) so a payment's PO can be traced. The PO lookup
 * only checked storeId, not supplier — a bill could be linked to a PO from
 * an entirely different supplier, corrupting that traceability. These
 * tests lock in the supplier-match guard.
 */
describe('CreateBillService — purchase order linkage', () => {
  const build = (supplier: any, po: any) => {
    const supplierRepository = { findOne: jest.fn().mockResolvedValue(supplier) };
    const purchaseOrderRepository = { findOne: jest.fn().mockResolvedValue(po) };
    // Unused by the validation path under test — the service should throw
    // before ever touching these.
    const noop = {} as any;

    return {
      service: new CreateBillService(
        noop,
        supplierRepository as any,
        purchaseOrderRepository as any,
        noop,
        noop,
        noop,
        noop,
        noop,
        noop,
        noop,
      ),
      supplierRepository,
      purchaseOrderRepository,
    };
  };

  it('rejects a bill whose purchaseOrderId belongs to a different supplier', async () => {
    const { service } = build(
      { id: 'supplier-1', name: 'Acme Corp' },
      { id: 'po-1', supplierId: 'supplier-2', storeId: 'store-1' },
    );

    await expect(
      service.execute(
        'tenant-1',
        'store-1',
        {
          supplierId: 'supplier-1',
          purchaseOrderId: 'po-1',
          billDate: '2026-01-01',
          lines: [],
        } as any,
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException when the purchase order does not exist in this store', async () => {
    const { service } = build({ id: 'supplier-1', name: 'Acme Corp' }, null);

    await expect(
      service.execute(
        'tenant-1',
        'store-1',
        {
          supplierId: 'supplier-1',
          purchaseOrderId: 'po-missing',
          billDate: '2026-01-01',
          lines: [],
        } as any,
        'user-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
