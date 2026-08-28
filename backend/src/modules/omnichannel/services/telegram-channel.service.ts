import {
  Injectable,
  Logger,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelCredentialsService } from './omnichannel-credentials.service';
import { OmnichannelMessageEntity } from '../entities/omnichannel-message.entity';
import { OmnichannelAiAutoReplyService } from './omnichannel-ai-auto-reply.service';

export interface TelegramIncomingMessage {
  id: string;
  updateId: number;
  messageId: number;
  chatId: number | string;
  senderName: string;
  senderUsername?: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  raw: any;
}

@Injectable()
export class TelegramChannelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramChannelService.name);
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private lastUpdateIdMap = new Map<string, number>();

  constructor(
    private readonly credentialsService: OmnichannelCredentialsService,
    @InjectRepository(OmnichannelMessageEntity)
    private readonly messageRepo: Repository<OmnichannelMessageEntity>,
    @Inject(forwardRef(() => OmnichannelAiAutoReplyService))
    private readonly aiAutoReplyService: OmnichannelAiAutoReplyService,
  ) {}

  onModuleInit() {
    this.startBackgroundPolling();
  }

  onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private startBackgroundPolling() {
    // Poll every 4 seconds for new incoming Telegram messages across active credentials
    this.pollingInterval = setInterval(async () => {
      if (this.isPolling) return;
      this.isPolling = true;
      try {
        await this.pollAllActiveTelegramBots();
      } catch (err: any) {
        // Silently skip
      } finally {
        this.isPolling = false;
      }
    }, 4000);
  }

  private async getBotToken(tenantId: string): Promise<string> {
    const cred = await this.credentialsService.findByPlatform(
      tenantId,
      'telegram',
      false,
    );
    if (!cred || !cred.credentials?.botToken || !cred.isActive) {
      throw new BadRequestException(
        'Telegram Bot Token is not configured or inactive. Please configure in Credentials.',
      );
    }
    return cred.credentials.botToken.trim();
  }

  private async pollAllActiveTelegramBots(): Promise<void> {
    const activeCreds = await this.credentialsService['credentialRepo'].find({
      where: { platform: 'telegram', isActive: true },
    });

    for (const cred of activeCreds) {
      const token = cred.credentials?.botToken;
      if (!token) continue;

      const tenantId = cred.tenantId;
      const lastUpdateId = this.lastUpdateIdMap.get(tenantId) || 0;

      try {
        let url = `https://api.telegram.org/bot${token.trim()}/getUpdates?limit=25&timeout=0`;
        if (lastUpdateId > 0) {
          url += `&offset=${lastUpdateId + 1}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || !data.ok) continue;

        const updates = data.result || [];
        for (const u of updates) {
          if (u.update_id > lastUpdateId) {
            this.lastUpdateIdMap.set(tenantId, u.update_id);
          }

          if (u.message && (u.message.text || u.message.caption)) {
            const msg = u.message;
            const from = msg.from;
            const senderName = from
              ? `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || 'Telegram User'
              : 'Telegram User';

            const externalId = `tg-msg-${msg.message_id}`;
            const existing = await this.messageRepo.findOne({
              where: { tenantId, platform: 'telegram', externalMessageId: externalId },
            });

            if (!existing) {
              const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=229ED9&color=fff&bold=true&size=128&rounded=true`;

              const record = this.messageRepo.create({
                tenantId,
                storeId: cred.storeId,
                platform: 'telegram',
                conversationId: `tg-${msg.chat.id}`,
                externalMessageId: externalId,
                senderId: String(msg.chat.id),
                senderName,
                senderAvatar: avatar,
                recipientId: 'bot',
                text: msg.text || msg.caption || '[Attachment]',
                direction: 'INBOUND',
                status: 'RECEIVED',
                type: 'text',
                rawMetadata: u,
              });

              await this.messageRepo.save(record);
              this.logger.log(`[Telegram INBOUND] From ${senderName} (${msg.chat.id}): "${record.text}"`);

              // Trigger AI Auto-Reply
              this.aiAutoReplyService
                .handleInboundMessage({
                  tenantId,
                  storeId: cred.storeId,
                  platform: 'telegram',
                  conversationId: `tg-${msg.chat.id}`,
                  senderId: String(msg.chat.id),
                  senderName,
                  text: record.text,
                  recipientId: 'bot',
                })
                .catch((err) =>
                  this.logger.error(`AI Auto-Reply error for Telegram: ${err.message}`),
                );
            }
          }
        }
      } catch (err) {
        // Ignored during polling
      }
    }
  }

  async getBotInfo(tenantId: string): Promise<any> {
    const token = await this.getBotToken(tenantId);
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new BadRequestException(
        data.description || 'Failed to fetch Telegram bot info',
      );
    }
    return data.result;
  }

  async sendMessage(
    tenantId: string,
    chatId: string | number,
    text: string,
    storeId?: string,
    options?: { skipDbSave?: boolean },
  ): Promise<any> {
    const token = await this.getBotToken(tenantId);
    if (!chatId || !text) {
      throw new BadRequestException('chatId and text are required to send a message');
    }

    const payload = {
      chat_id: chatId,
      text,
    };

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      this.logger.error(`Telegram send error: ${JSON.stringify(data)}`);
      throw new BadRequestException(
        data.description || 'Failed to deliver message via Telegram',
      );
    }

    if (!options?.skipDbSave) {
      // Save outbound message to DB
      const outbound = this.messageRepo.create({
        tenantId,
        storeId,
        platform: 'telegram',
        conversationId: `tg-${chatId}`,
        externalMessageId: `tg-out-${data.result?.message_id || Date.now()}`,
        senderId: 'agent',
        senderName: 'Merchant Agent',
        recipientId: String(chatId),
        text,
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        type: 'text',
        rawMetadata: data.result,
      });
      await this.messageRepo.save(outbound);
    }

    return {
      success: true,
      message: 'Message delivered to Telegram user',
      result: data.result,
    };
  }

  async handleWebhookUpdate(tenantId: string, update: any, storeId?: string): Promise<any> {
    if (update.message && (update.message.text || update.message.caption)) {
      const msg = update.message;
      const from = msg.from;
      const senderName = from
        ? `${from.first_name || ''} ${from.last_name || ''}`.trim() || from.username || 'Telegram User'
        : 'Telegram User';

      const externalId = `tg-msg-${msg.message_id}`;
      const existing = await this.messageRepo.findOne({
        where: { tenantId, platform: 'telegram', externalMessageId: externalId },
      });

      if (!existing) {
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=229ED9&color=fff&bold=true&size=128&rounded=true`;

        const record = this.messageRepo.create({
          tenantId,
          storeId,
          platform: 'telegram',
          conversationId: `tg-${msg.chat.id}`,
          externalMessageId: externalId,
          senderId: String(msg.chat.id),
          senderName,
          senderAvatar: avatar,
          recipientId: 'bot',
          text: msg.text || msg.caption || '[Attachment]',
          direction: 'INBOUND',
          status: 'RECEIVED',
          type: 'text',
          rawMetadata: update,
        });

        await this.messageRepo.save(record);

        // Trigger AI Auto-Reply
        this.aiAutoReplyService
          .handleInboundMessage({
            tenantId,
            storeId,
            platform: 'telegram',
            conversationId: `tg-${msg.chat.id}`,
            senderId: String(msg.chat.id),
            senderName,
            text: record.text,
            recipientId: 'bot',
          })
          .catch((err) =>
            this.logger.error(`AI Auto-Reply error for Telegram: ${err.message}`),
          );
      }
    }

    return { ok: true };
  }
}
