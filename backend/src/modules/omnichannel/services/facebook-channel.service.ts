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
export class FacebookChannelService {
  private readonly logger = new Logger(FacebookChannelService.name);

  constructor(
    private readonly credentialsService: OmnichannelCredentialsService,
    @InjectRepository(OmnichannelMessageEntity)
    private readonly messageRepo: Repository<OmnichannelMessageEntity>,
  ) {}

  private async getPageAccessToken(tenantId: string): Promise<string> {
    const cred = await this.credentialsService.findByPlatform(
      tenantId,
      'facebook',
      false,
    );
    const token =
      cred?.credentials?.pageAccessToken || cred?.credentials?.accessToken;
    if (!token || !cred?.isActive) {
      throw new BadRequestException(
        'Facebook Messenger Page Token is not configured or active. Please configure in Credentials.',
      );
    }
    return token.trim();
  }

  async verifyWebhook(
    mode?: string,
    token?: string,
    challenge?: string,
    tenantId?: string,
  ): Promise<string> {
    this.logger.log(
      `Facebook webhook verification: mode=${mode}, token=${token}, challenge=${challenge}`,
    );

    if (mode !== 'subscribe' || !token) {
      throw new ForbiddenException('Invalid mode or missing verification token');
    }

    let configuredToken = process.env.FB_VERIFY_TOKEN || 'omnichannel_verify_token';
    if (tenantId) {
      const cred = await this.credentialsService.findByPlatform(
        tenantId,
        'facebook',
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
      this.logger.log('Facebook Webhook Verified Successfully!');
      return challenge || '';
    }

    throw new ForbiddenException('Verification token mismatch');
  }

  async handleWebhookEvent(body: any, targetTenantId?: string): Promise<string> {
    this.logger.log(`Facebook webhook event received: ${JSON.stringify(body)}`);

    if (body.object === 'page') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const pageId = entry.id;
        const messagingEvents = entry.messaging || [];

        // Match tenant by pageId
        let tenantId = targetTenantId;
        let storeId: string | undefined;

        if (!tenantId) {
          const allCreds = await this.credentialsService['credentialRepo'].find({
            where: { platform: 'facebook' },
          });
          const matching = allCreds.find(
            (c) =>
              c.credentials?.pageId === pageId ||
              c.metadata?.pageId === pageId ||
              c.isActive,
          );
          tenantId = matching?.tenantId;
          storeId = matching?.storeId;
        }

        if (!tenantId) continue;

        const token = await this.getPageAccessToken(tenantId).catch(() => null);

        for (const event of messagingEvents) {
          if (event.message) {
            const senderId = event.sender?.id;
            const msg = event.message;

            let senderName = `Facebook User (${senderId})`;
            let senderAvatar: string | undefined;

            if (token && senderId) {
              try {
                const userRes = await fetch(
                  `https://graph.facebook.com/v19.0/${senderId}?fields=first_name,last_name,profile_pic&access_token=${token}`,
                );
                const userData = await userRes.json();
                if (userData.first_name) {
                  senderName = `${userData.first_name} ${userData.last_name || ''}`.trim();
                }
                if (userData.profile_pic) {
                  senderAvatar = userData.profile_pic;
                }
              } catch (e) {
                // Ignore profile lookup failure
              }
            }

            const externalId = `fb-msg-${msg.mid || Date.now()}`;
            const existing = await this.messageRepo.findOne({
              where: { tenantId, platform: 'facebook', externalMessageId: externalId },
            });

            if (!existing) {
              const avatar =
                senderAvatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=1877F2&color=fff&bold=true&size=128&rounded=true`;

              const record = this.messageRepo.create({
                tenantId,
                storeId,
                platform: 'facebook',
                conversationId: `fb-${senderId}`,
                externalMessageId: externalId,
                senderId: String(senderId),
                senderName,
                senderAvatar: avatar,
                recipientId: String(pageId),
                text: msg.text || (msg.attachments ? '[Attachment / Media]' : ''),
                direction: 'INBOUND',
                status: 'RECEIVED',
                type: 'text',
                rawMetadata: event,
              });

              await this.messageRepo.save(record);
              this.logger.log(`[Facebook INBOUND] From ${senderName} (${senderId}): "${record.text}"`);
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
    recipientId: string,
    text: string,
    storeId?: string,
  ): Promise<any> {
    const accessToken = await this.getPageAccessToken(tenantId);
    if (!recipientId || !text) {
      throw new BadRequestException('recipientId and text are required');
    }

    const payload = {
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();
    if (!res.ok || data.error) {
      this.logger.error(`Facebook send message error: ${JSON.stringify(data)}`);
      throw new BadRequestException(
        data.error?.message || 'Failed to send message via Facebook Messenger',
      );
    }

    // Save outbound message to DB
    const outbound = this.messageRepo.create({
      tenantId,
      storeId,
      platform: 'facebook',
      conversationId: `fb-${recipientId}`,
      externalMessageId: `fb-out-${data.message_id || Date.now()}`,
      senderId: 'agent',
      senderName: 'Merchant Agent',
      recipientId,
      text,
      direction: 'OUTBOUND',
      status: 'DELIVERED',
      type: 'text',
      rawMetadata: data,
    });
    await this.messageRepo.save(outbound);

    return {
      success: true,
      message: 'Message delivered to Facebook Messenger user',
      result: data,
    };
  }
}
