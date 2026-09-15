import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OrderNumberSequenceEntity } from '../entities/order-number-sequence.entity';

const NUMBER_PREFIX = 'ORD-';
const PAD_LENGTH = 6;

@Injectable()
export class GenerateOrderNumberService {
  /**
   * Must be called with the `EntityManager` of an already-open transaction so the
   * `FOR UPDATE` lock actually serializes concurrent callers for this tenant — calling
   * it outside a transaction would still work but loses the collision guarantee.
   */
  async execute(manager: EntityManager, tenantId: string): Promise<string> {
    let sequence = await manager.findOne(OrderNumberSequenceEntity, {
      where: { tenantId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!sequence) {
      // First order for this tenant: insert then re-select under the lock so a
      // simultaneous first-order request from the same tenant can't both insert.
      await manager
        .createQueryBuilder()
        .insert()
        .into(OrderNumberSequenceEntity)
        .values({ tenantId, lastValue: 0 })
        .orIgnore()
        .execute();

      sequence = await manager.findOne(OrderNumberSequenceEntity, {
        where: { tenantId },
        lock: { mode: 'pessimistic_write' },
      });
    }

    const nextValue = (sequence?.lastValue ?? 0) + 1;
    await manager.update(OrderNumberSequenceEntity, { tenantId }, { lastValue: nextValue });

    return `${NUMBER_PREFIX}${nextValue.toString().padStart(PAD_LENGTH, '0')}`;
  }
}
