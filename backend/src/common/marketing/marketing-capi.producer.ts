import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export const MARKETING_CAPI_QUEUE = 'marketing-capi';

export interface OrderConversionJob {
  type: 'ORDER_CONVERSION';
  tenantId: string;
  storeId: string;
  orderId: string;
  orderRef: string;
  eventName: 'Purchase' | 'InitiateCheckout';
  value?: number;
  currency?: string;
  contentIds?: string[];
  numItems?: number;
  sessionId?: string;
  sourceUrl?: string;
  user?: {
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  };
}

/**
 * Enqueue-only wrapper that lets any module hand the marketing module an order
 * conversion for server-side (CAPI) dispatch without importing anything from the
 * marketing module — the queue is the boundary. Lives in `common/` so both the
 * producer side (OrderModule) and the consumer side (MarketingModule) depend only
 * on this shared, domain-free contract.
 *
 * Registered by whichever module owns the `marketing-capi` queue
 * (`BullModule.registerQueue`), and provided globally.
 */
@Injectable()
export class MarketingCapiProducer {
  private readonly logger = new Logger(MarketingCapiProducer.name);

  constructor(@InjectQueue(MARKETING_CAPI_QUEUE) private readonly queue: Queue) {}

  async enqueueOrderConversion(job: OrderConversionJob): Promise<void> {
    try {
      await this.queue.add('dispatch', job, {
        attempts: 4,
        backoff: { type: 'exponential', delay: 10_000 },
        removeOnComplete: 200,
        removeOnFail: 500,
      });
    } catch (err) {
      // Enqueue must never break checkout — a lost conversion event is acceptable.
      this.logger.warn(`Failed to enqueue marketing CAPI job: ${(err as Error).message}`);
    }
  }
}
