import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MARKETING_CAPI_QUEUE, OrderConversionJob } from '../../common/marketing/marketing-capi.producer';
import { DispatchServerEventService } from './services/dispatch-server-event.service';

/**
 * Consumes `marketing-capi` jobs and fans an order conversion out to every
 * capiEnabled pixel in the store whose page rules allow the checkout / thank-you
 * page. Retries are handled by BullMQ (see the producer's job opts) — a thrown
 * error here re-queues the whole job.
 */
@Processor(MARKETING_CAPI_QUEUE)
export class MarketingCapiProcessor extends WorkerHost {
  private readonly logger = new Logger(MarketingCapiProcessor.name);

  constructor(private readonly dispatchServerEventService: DispatchServerEventService) {
    super();
  }

  async process(job: Job<OrderConversionJob>): Promise<void> {
    const data = job.data;
    if (data.type !== 'ORDER_CONVERSION') return;

    const pageType = data.eventName === 'Purchase' ? 'THANK_YOU' : 'CHECKOUT';
    const pathname = data.eventName === 'Purchase' ? '/checkout/success' : '/checkout';

    const summary = await this.dispatchServerEventService.dispatchForStore(
      data.tenantId,
      data.storeId,
      {
        eventName: data.eventName,
        eventTime: new Date(),
        sourceUrl: data.sourceUrl,
        sessionId: data.sessionId,
        orderId: data.orderId,
        orderRef: data.orderRef,
        value: data.value,
        currency: data.currency,
        contentIds: data.contentIds,
        numItems: data.numItems,
        user: data.user,
      },
      { pathname, pageType },
    );

    this.logger.log(
      `CAPI order ${data.orderRef} (${data.eventName}): sent=${summary.sent} failed=${summary.failed} skipped=${summary.skipped}`,
    );

    // Surface a hard failure so BullMQ retries, but only when *nothing* got
    // through and at least one pixel was attempted.
    if (summary.sent === 0 && summary.failed > 0) {
      throw new Error(
        `All ${summary.failed} CAPI dispatch(es) failed for order ${data.orderRef} — will retry.`,
      );
    }
  }
}
