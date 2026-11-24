import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdatePurchaseOrderService } from './update-purchase-order.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '../dto/purchase-order.dto';
import { PurchaseOrderStatusEnum } from '../entities/purchase-order.entity';

/**
 * A purchase order reaches SENT only through Finance approving (and paying) its
 * requisition. The API used to accept status 'SENT' directly, which let a PO skip
 * Finance approval, and allowed an already-paid SENT order to be pushed back to
 * PENDING_APPROVAL — creating a second requisition for the same supplier payment.
 */
describe('Purchase order status — Finance approval is the only path to SENT', () => {
  async function statusErrors(dtoClass: typeof CreatePurchaseOrderDto | typeof UpdatePurchaseOrderDto, status: string) {
    const dto = plainToInstance(dtoClass, { status });
    const errors = await validate(dto, { skipMissingProperties: true });
    return errors.filter((e) => e.property === 'status');
  }

  it.each(['SENT', 'APPROVED'])('rejects status %s on create and update', async (status) => {
    expect(await statusErrors(CreatePurchaseOrderDto, status)).toHaveLength(1);
    expect(await statusErrors(UpdatePurchaseOrderDto, status)).toHaveLength(1);
  });

  it.each(['DRAFT', 'PENDING_APPROVAL'])('accepts status %s on create and update', async (status) => {
    expect(await statusErrors(CreatePurchaseOrderDto, status)).toHaveLength(0);
    expect(await statusErrors(UpdatePurchaseOrderDto, status)).toHaveLength(0);
  });

  it('refuses to change the status of a PO that Finance already approved and paid', async () => {
    const purchaseOrderRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'po-1',
        storeId: 'store-1',
        status: PurchaseOrderStatusEnum.SENT,
        lines: [],
      }),
    };
    const dataSource = { transaction: jest.fn() };
    const noop = {} as any;
    const service = new UpdatePurchaseOrderService(
      purchaseOrderRepository as any,
      noop,
      noop,
      noop,
      dataSource as any,
    );

    await expect(
      service.execute('tenant-1', 'store-1', 'po-1', { status: 'PENDING_APPROVAL' }),
    ).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
