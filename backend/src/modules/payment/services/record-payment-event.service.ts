import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEventEntity } from '../entities/payment-event.entity';
import { PaymentEventTypeEnum } from '../enums/payment-event-type.enum';

export interface RecordPaymentEventInput {
  tenantId: string;
  paymentId: string;
  type: PaymentEventTypeEnum;
  message?: string;
  /** Gateway event identifier — supplying it makes the write idempotent. */
  externalEventId?: string;
  metadata?: Record<string, unknown>;
}

/** Postgres unique-violation code. */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class RecordPaymentEventService {
  private readonly logger = new Logger(RecordPaymentEventService.name);

  constructor(
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepository: Repository<PaymentEventEntity>,
  ) {}

  /**
   * Appends a payment timeline event.
   *
   * When `externalEventId` is supplied the insert is idempotent: a replayed
   * gateway webhook hits the partial unique index and is swallowed, returning
   * null so callers can skip the side effects that would otherwise duplicate
   * an order update or a refund.
   *
   * @returns the stored event, or null when it was a duplicate replay.
   */
  async execute(input: RecordPaymentEventInput): Promise<PaymentEventEntity | null> {
    try {
      const event = this.paymentEventRepository.create({
        tenantId: input.tenantId,
        paymentId: input.paymentId,
        type: input.type,
        message: input.message,
        externalEventId: input.externalEventId,
        metadata: input.metadata,
      });
      return await this.paymentEventRepository.save(event);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === UNIQUE_VIOLATION && input.externalEventId) {
        this.logger.warn(
          `Duplicate payment event ${input.externalEventId} for payment ${input.paymentId} ignored.`,
        );
        return null;
      }
      throw error;
    }
  }

  /**
   * True when this gateway event has already been applied to this payment.
   * Lets callers short-circuit before performing any state mutation.
   */
  async hasProcessed(paymentId: string, externalEventId: string): Promise<boolean> {
    if (!externalEventId) return false;
    const existing = await this.paymentEventRepository.findOne({
      where: { paymentId, externalEventId },
      select: ['id'],
    });
    return Boolean(existing);
  }
}
