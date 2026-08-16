import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import axios from 'axios';
import { WebhookEntity, WebhookEventEnum } from '../entities/webhook.entity';
import { CreateWebhookDto, UpdateWebhookDto } from '../dto/webhook.dto';

@Injectable()
export class ManageWebhooksService {
  private readonly logger = new Logger(ManageWebhooksService.name);

  constructor(
    @InjectRepository(WebhookEntity)
    private readonly webhookRepository: Repository<WebhookEntity>,
  ) {}

  async list(tenantId: string, storeId: string): Promise<WebhookEntity[]> {
    return this.webhookRepository.find({
      where: { tenantId, storeId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(tenantId: string, storeId: string, dto: CreateWebhookDto): Promise<WebhookEntity> {
    const webhook = this.webhookRepository.create({
      tenantId,
      storeId,
      targetUrl: dto.targetUrl,
      events: dto.events,
      secret: `whsec_${crypto.randomBytes(24).toString('hex')}`,
      isActive: dto.isActive ?? true,
    });
    return this.webhookRepository.save(webhook);
  }

  async update(tenantId: string, webhookId: string, dto: UpdateWebhookDto): Promise<WebhookEntity> {
    const webhook = await this.webhookRepository.findOne({ where: { id: webhookId, tenantId } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found.');
    }

    if (dto.targetUrl !== undefined) webhook.targetUrl = dto.targetUrl;
    if (dto.events !== undefined) webhook.events = dto.events;
    if (dto.isActive !== undefined) webhook.isActive = dto.isActive;

    return this.webhookRepository.save(webhook);
  }

  async remove(tenantId: string, webhookId: string): Promise<{ success: boolean }> {
    const result = await this.webhookRepository.delete({ id: webhookId, tenantId });
    if (!result.affected) {
      throw new NotFoundException('Webhook not found.');
    }
    return { success: true };
  }

  /**
   * Sends a signed test payload so a merchant can verify their endpoint before
   * relying on real events. Delivery failures are reported back rather than
   * thrown, so a broken endpoint surfaces as a readable message in the UI.
   */
  async sendTest(tenantId: string, webhookId: string): Promise<{ success: boolean; message: string }> {
    const webhook = await this.webhookRepository.findOne({ where: { id: webhookId, tenantId } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found.');
    }

    const payload = {
      event: 'TEST',
      sentAt: new Date().toISOString(),
      data: { message: 'This is a test event from EasyCommerce.' },
    };

    const result = await this.dispatch(webhook, payload);
    return {
      success: result.success,
      message: result.success
        ? `Test event delivered successfully (HTTP ${result.status}).`
        : `Delivery failed: ${result.error}`,
    };
  }

  /**
   * Fans an event out to every active webhook subscribed to it. Called by other
   * modules via DI; never throws, so a failing endpoint can't roll back the
   * business operation that triggered it.
   */
  async dispatchEvent(
    tenantId: string,
    storeId: string,
    event: WebhookEventEnum,
    data: unknown,
  ): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { tenantId, storeId, isActive: true },
    });

    const subscribed = webhooks.filter((w) => (w.events || []).includes(event));

    await Promise.all(
      subscribed.map((webhook) =>
        this.dispatch(webhook, { event, sentAt: new Date().toISOString(), data }),
      ),
    );
  }

  private async dispatch(
    webhook: WebhookEntity,
    payload: unknown,
  ): Promise<{ success: boolean; status?: number; error?: string }> {
    const body = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', webhook.secret).update(body).digest('hex');

    try {
      const response = await axios.post(webhook.targetUrl, body, {
        headers: {
          'Content-Type': 'application/json',
          'x-easycommerce-signature': signature,
        },
        timeout: 8000,
      });

      webhook.lastTriggeredAt = new Date();
      webhook.failureCount = 0;
      webhook.lastError = undefined;
      await this.webhookRepository.save(webhook);

      return { success: true, status: response.status };
    } catch (err: any) {
      const message = err?.response?.status
        ? `HTTP ${err.response.status}`
        : err?.message || 'Connection error';

      webhook.lastTriggeredAt = new Date();
      webhook.failureCount = (webhook.failureCount || 0) + 1;
      webhook.lastError = message;
      await this.webhookRepository.save(webhook);

      this.logger.warn(`Webhook ${webhook.id} delivery failed: ${message}`);
      return { success: false, error: message };
    }
  }
}
