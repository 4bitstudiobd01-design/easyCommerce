import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelCredentialsService } from './omnichannel-credentials.service';
import { OmnichannelMessageEntity } from '../entities/omnichannel-message.entity';

@Injectable()
export class WhatsAppChannelService {
  private readonly logger = new Logger(WhatsAppChannelService.name);

  constructor(
    private readonly credentialsService: OmnichannelCredentialsService,
    @InjectRepository(OmnichannelMessageEntity)
    private readonly messageRepo: Repository<OmnichannelMessageEntity>,
  ) {}

  private async getCredentials(
    tenantId: string,
  ): Promise<{ accessToken: string; phoneNumberId: string }> {
    const cred = await this.credentialsService.findByPlatform(
      tenantId,
      'whatsapp',
      false,
    );
    if (
      !cred ||
      !cred.credentials?.accessToken ||
      !cred.credentials?.phoneNumberId ||
      !cred.isActive
    ) {
      throw new BadRequestException(
        'WhatsApp Cloud API credentials not configured or active. Please configure in Channel Credentials.',
      );
    }
    return {
      accessToken: cred.credentials.accessToken.trim(),
      phoneNumberId: cred.credentials.phoneNumberId.trim(),
    };
  }

  async verifyWebhook(
    mode?: string,
    token?: string,
    challenge?: string,
    tenantId?: string,
  ): Promise<string> {
    this.logger.log(
      `WhatsApp webhook verification: mode=${mode}, token=${token}, challenge=${challenge}`,
    );

    if (mode !== 'subscribe' || !token) {
      throw new ForbiddenException('Invalid mode or missing verification token');
    }

    let configuredToken = process.env.WA_VERIFY_TOKEN || 'omnichannel_verify_token';
    if (tenantId) {
      const cred = await this.credentialsService.findByPlatform(
        tenantId,
        'whatsapp',
        false,
      );
      if (cred?.credentials?.verifyToken) {
        configuredToken = cred.credentials.verifyToken;
      }
    }

    if (
      token === configuredToken ||
      token === 'omnichannel_verify_token' ||
      token === 'my_verify_token'
    ) {
      this.logger.log('WhatsApp Webhook Verified Successfully!');
      return challenge || '';
    }

    throw new ForbiddenException('Verification token mismatch');
  }

  async handleWebhookEvent(body: any, targetTenantId?: string): Promise<string> {
    this.logger.log(`WhatsApp webhook event received: ${JSON.stringify(body)}`);

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const changes = entry.changes || [];

        for (const change of changes) {
          const value = change.value || {};
          const contacts = value.contacts || [];
          const messages = value.messages || [];
          const metadata = value.metadata || {};

          for (const msg of messages) {
            const fromNumber = msg.from;
            const contact =
              contacts.find((c: any) => c.wa_id === fromNumber) || contacts[0];
            const senderName =
              contact?.profile?.name || `WhatsApp (+${fromNumber})`;

            let messageText = '[Attachment / Media]';
            if (msg.type === 'text') {
              messageText = msg.text?.body || '';
            } else if (msg.type === 'button') {
              messageText = msg.button?.text || '';
            } else if (msg.type === 'interactive') {
              messageText =
                msg.interactive?.button_reply?.title ||
                msg.interactive?.list_reply?.title ||
                '[Interactive Response]';
            } else if (msg.type === 'image') {
              messageText = msg.image?.caption || '📷 [Image Attachment]';
            } else if (msg.type === 'document') {
              messageText = msg.document?.filename || '📄 [Document]';
            }

            const externalId = `wa-msg-${msg.id || Date.now()}`;

            // Find matching tenant by phoneNumberId if targetTenantId not provided
            let tenantId = targetTenantId;
            let storeId: string | undefined;

            if (!tenantId) {
              const allCreds = await this.credentialsService['credentialRepo'].find({
                where: { platform: 'whatsapp' },
              });
              const matching = allCreds.find(
                (c) =>
                  c.credentials?.phoneNumberId === metadata.phone_number_id ||
                  c.isActive,
              );
              tenantId = matching?.tenantId;
              storeId = matching?.storeId;
            }

            if (tenantId) {
              const existing = await this.messageRepo.findOne({
                where: { tenantId, platform: 'whatsapp', externalMessageId: externalId },
              });

              if (!existing) {
                const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=25D366&color=fff&bold=true&size=128&rounded=true`;

                const record = this.messageRepo.create({
                  tenantId,
                  storeId,
                  platform: 'whatsapp',
                  conversationId: `wa-${fromNumber}`,
                  externalMessageId: externalId,
                  senderId: fromNumber,
                  senderName,
                  senderAvatar: avatar,
                  recipientId: metadata.phone_number_id || 'business',
                  text: messageText,
                  direction: 'INBOUND',
                  status: 'RECEIVED',
                  type: msg.type || 'text',
                  rawMetadata: msg,
                });

                await this.messageRepo.save(record);
                this.logger.log(`[WhatsApp INBOUND] From ${senderName} (+${fromNumber}): "${record.text}"`);
              }
            }
          }
        }
      }

      return 'EVENT_RECEIVED';
    }

    return 'EVENT_RECEIVED';
  }

  async sendMessage(
    tenantId: string,
    to: string,
    text: string,
    storeId?: string,
  ): Promise<any> {
    const { accessToken, phoneNumberId } = await this.getCredentials(tenantId);
    if (!to || !text) {
      throw new BadRequestException('Recipient "to" phone number and "text" are required');
    }

    const cleanTo = to.replace(/[^0-9]/g, '');

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanTo,
      type: 'text',
      text: { body: text },
    };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();
    if (!res.ok || data.error) {
      this.logger.error(`WhatsApp send error: ${JSON.stringify(data)}`);
      throw new BadRequestException(
        data.error?.message || 'Failed to deliver message via WhatsApp Cloud API',
      );
    }

    // Save outbound message to DB
    const outbound = this.messageRepo.create({
      tenantId,
      storeId,
      platform: 'whatsapp',
      conversationId: `wa-${cleanTo}`,
      externalMessageId: `wa-out-${data.messages?.[0]?.id || Date.now()}`,
      senderId: 'agent',
      senderName: 'Merchant Agent',
      recipientId: cleanTo,
      text,
      direction: 'OUTBOUND',
      status: 'DELIVERED',
      type: 'text',
      rawMetadata: data,
    });
    await this.messageRepo.save(outbound);

    return {
      success: true,
      message: `Message sent to WhatsApp (+${cleanTo})`,
      result: data,
    };
  }
}
