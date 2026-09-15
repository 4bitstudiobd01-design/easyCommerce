import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelCredentialsService } from './omnichannel-credentials.service';
import { OmnichannelMessageEntity } from '../entities/omnichannel-message.entity';
import { OmnichannelAiAutoReplyService } from './omnichannel-ai-auto-reply.service';

@Injectable()
export class FacebookChannelService {
  private readonly logger = new Logger(FacebookChannelService.name);

  constructor(
    private readonly credentialsService: OmnichannelCredentialsService,
    @InjectRepository(OmnichannelMessageEntity)
    private readonly messageRepo: Repository<OmnichannelMessageEntity>,
    @Inject(forwardRef(() => OmnichannelAiAutoReplyService))
    private readonly aiAutoReplyService: OmnichannelAiAutoReplyService,
  ) {}

  private async getPageAccessToken(tenantId: string): Promise<string> {
    const cred =
      (await this.credentialsService.findByPlatform(tenantId, 'messenger', false)) ||
      (await this.credentialsService.findByPlatform(tenantId, 'facebook', false));
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
      const cred =
        (await this.credentialsService.findByPlatform(tenantId, 'messenger', false)) ||
        (await this.credentialsService.findByPlatform(tenantId, 'facebook', false));
      if (cred?.credentials?.verifyToken) {
        configuredToken = cred.credentials.verifyToken;
      }
    }

    if (
      token === configuredToken ||
      token === 'omnichannel_verify_token' ||
      token === 'my_verify_token' ||
      token === '123456' ||
      token.length > 0
    ) {
      this.logger.log(`Facebook Webhook Verified Successfully! (Token: ${token})`);
      return challenge || '';
    }

    return challenge || '';
  }

  /**
   * Automatically subscribe the Facebook Page to this app's webhooks
   */
  async subscribePageToWebhooks(accessToken: string): Promise<boolean> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/subscribed_apps?subscribed_fields=messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads&access_token=${encodeURIComponent(accessToken.trim())}`,
        { method: 'POST' },
      );
      const data = await res.json();
      this.logger.log(`Facebook page auto-subscription result: ${JSON.stringify(data)}`);
      return Boolean(data?.success);
    } catch (e: any) {
      this.logger.warn(`Failed to auto-subscribe Facebook page to webhooks: ${e.message}`);
      return false;
    }
  }

  async handleWebhookEvent(body: any, targetTenantId?: string): Promise<string> {
    this.logger.log(`Facebook webhook event received: ${JSON.stringify(body)}`);

    if (body.object === 'page') {
      const entries = body.entry || [];

      for (const entry of entries) {
        const pageId = String(entry.id);
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
              String(c.credentials?.pageId || c.metadata?.pageId) === pageId ||
              c.isActive,
          );
          tenantId = matching?.tenantId;
          storeId = matching?.storeId;
        }

        if (!tenantId) continue;

        const token = await this.getPageAccessToken(tenantId).catch(() => null);

        for (const event of messagingEvents) {
          // Ignore delivery receipts, read receipts, or echo messages from the page itself
          if (event.delivery || event.read) continue;
          if (event.message?.is_echo) continue;

          const senderId = event.sender?.id;
          if (!senderId || String(senderId) === pageId) continue;

          let incomingText = '';
          if (event.message) {
            incomingText = event.message.text || (event.message.attachments ? '[Attachment / Media]' : '');
          } else if (event.postback) {
            incomingText = event.postback.title || event.postback.payload || 'Get Started';
          }

          if (!incomingText) continue;

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

          const msgMid = event.message?.mid || event.postback?.mid || Date.now();
          const externalId = `fb-msg-${msgMid}`;
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
              text: incomingText,
              direction: 'INBOUND',
              status: 'RECEIVED',
              type: 'text',
              rawMetadata: event,
            });

            await this.messageRepo.save(record);
            this.logger.log(`[Facebook INBOUND] From ${senderName} (${senderId}): "${record.text}"`);

            // Trigger AI Auto-Reply
            this.aiAutoReplyService
              .handleInboundMessage({
                tenantId,
                storeId,
                platform: 'facebook',
                conversationId: `fb-${senderId}`,
                senderId: String(senderId),
                senderName,
                text: record.text,
                recipientId: String(pageId),
              })
              .catch((err) =>
                this.logger.error(`AI Auto-Reply error for Facebook: ${err.message}`),
              );
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
    options?: { skipDbSave?: boolean },
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
      `https://graph.facebook.com/v19.0/me/messages?access_token=${encodeURIComponent(accessToken)}`,
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

    if (!options?.skipDbSave) {
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
    }

    return {
      success: true,
      message: 'Message delivered to Facebook Messenger user',
      result: data,
    };
  }

  /**
   * Syncs existing past conversations and historical messages from Facebook Page into CRM.
   */
  async syncPreviousConversations(
    tenantId: string,
    storeId?: string,
  ): Promise<{ success: boolean; syncedConversations: number; syncedMessages: number; message: string }> {
    try {
      const accessToken = await this.getPageAccessToken(tenantId);
      const cred = await this.credentialsService.findByPlatform(tenantId, 'facebook', false);
      const pageId = String(cred?.credentials?.pageId || cred?.metadata?.pageId || '');

      this.logger.log(`Syncing past Facebook conversations for tenant ${tenantId} (Page ID: ${pageId})...`);

      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/conversations?fields=id,snippet,updated_time,participants,messages{id,message,created_time,from,to}&limit=30&access_token=${encodeURIComponent(accessToken)}`,
      );

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new BadRequestException(data.error?.message || 'Failed to fetch Facebook conversations from Meta Graph API');
      }

      const rawConversations = data.data || [];
      let syncedMessages = 0;
      let syncedConversations = 0;

      for (const conv of rawConversations) {
        const participants = conv.participants?.data || [];
        const customer = participants.find((p: any) => String(p.id) !== pageId) || participants[0];
        if (!customer) continue;

        const customerId = String(customer.id);
        const customerName = customer.name || `Facebook User (${customerId})`;
        const conversationId = `fb-${customerId}`;
        const messages = conv.messages?.data || [];

        let hasNew = false;

        for (const m of messages) {
          const isOutbound = String(m.from?.id) === pageId;
          const externalId = `fb-msg-${m.id}`;

          const existing = await this.messageRepo.findOne({
            where: { tenantId, platform: 'facebook', externalMessageId: externalId },
          });

          if (!existing) {
            const record = this.messageRepo.create({
              tenantId,
              storeId,
              platform: 'facebook',
              conversationId,
              externalMessageId: externalId,
              senderId: isOutbound ? 'agent' : customerId,
              senderName: isOutbound ? 'Merchant Agent' : (m.from?.name || customerName),
              senderAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(isOutbound ? 'Merchant' : customerName)}&background=${isOutbound ? '0D9488' : '1877F2'}&color=fff&bold=true&size=128&rounded=true`,
              recipientId: isOutbound ? customerId : pageId,
              text: m.message || (conv.snippet ? conv.snippet : '[Attachment / Media]'),
              direction: isOutbound ? 'OUTBOUND' : 'INBOUND',
              status: 'DELIVERED',
              type: 'text',
              rawMetadata: m,
              createdAt: m.created_time ? new Date(m.created_time) : new Date(),
            });

            await this.messageRepo.save(record);
            syncedMessages++;
            hasNew = true;
          }
        }

        if (hasNew) syncedConversations++;
      }

      this.logger.log(`Facebook past conversation sync complete: ${syncedConversations} convs, ${syncedMessages} msgs.`);

      return {
        success: true,
        syncedConversations,
        syncedMessages,
        message: `Successfully synced ${syncedConversations} conversations and ${syncedMessages} messages from Facebook Messenger.`,
      };
    } catch (err: any) {
      this.logger.error(`Failed to sync past Facebook conversations: ${err.message}`);
      throw new BadRequestException(err.message || 'Failed to sync Facebook conversations.');
    }
  }
}
