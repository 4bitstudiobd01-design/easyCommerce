import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelMessageEntity } from '../entities/omnichannel-message.entity';
import { OmnichannelPlatformType } from '../entities/omnichannel-credential.entity';
import { OmnichannelConversationStateEntity } from '../entities/omnichannel-conversation-state.entity';
import { TelegramChannelService } from './telegram-channel.service';
import { WhatsAppChannelService } from './whatsapp-channel.service';
import { FacebookChannelService } from './facebook-channel.service';
import { InstagramChannelService } from './instagram-channel.service';
import { OmnichannelAiAutoReplyService } from './omnichannel-ai-auto-reply.service';
import { CustomerEntity } from '../../customer/entities/customer.entity';

export interface UnifiedConversationItem {
  id: string; // conversationId
  customerName: string;
  avatarUrl: string;
  platform: OmnichannelPlatformType;
  platformDetail: string;
  recipientId: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  status: 'all' | 'unread' | 'resolved';
  customerId?: string;
  isAiPaused?: boolean;
  pausedReason?: string;
}

export interface ConversationMessageItem {
  id: string;
  sender: 'agent' | 'customer';
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  platform: OmnichannelPlatformType;
  status: 'sent' | 'delivered' | 'read' | 'received';
  type: string;
  senderType?: 'customer' | 'agent' | 'ai' | 'system';
  isAiGenerated?: boolean;
  aiMetadata?: Record<string, any>;
}

@Injectable()
export class OmnichannelChatService {
  private readonly logger = new Logger(OmnichannelChatService.name);

  constructor(
    @InjectRepository(OmnichannelMessageEntity)
    private readonly messageRepo: Repository<OmnichannelMessageEntity>,
    @InjectRepository(OmnichannelConversationStateEntity)
    private readonly stateRepo: Repository<OmnichannelConversationStateEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    private readonly telegramService: TelegramChannelService,
    private readonly whatsappService: WhatsAppChannelService,
    private readonly facebookService: FacebookChannelService,
    private readonly instagramService: InstagramChannelService,
    @Inject(forwardRef(() => OmnichannelAiAutoReplyService))
    private readonly aiAutoReplyService: OmnichannelAiAutoReplyService,
  ) {}

  async getConversations(
    tenantId: string,
    platform?: string,
    search?: string,
  ): Promise<UnifiedConversationItem[]> {
    // 1. Group recent messages by conversationId
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId });

    if (platform && platform !== 'all') {
      qb.andWhere('m.platform = :platform', { platform });
    }

    const messages = await qb
      .orderBy('m.createdAt', 'DESC')
      .getMany();

    // Fetch conversation AI states
    const states = await this.stateRepo.find({ where: { tenantId } });
    const stateMap = new Map<string, OmnichannelConversationStateEntity>();
    for (const s of states) {
      stateMap.set(s.conversationId, s);
    }

    const conversationMap = new Map<string, OmnichannelMessageEntity[]>();
    for (const msg of messages) {
      const convId = msg.conversationId;
      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, []);
      }
      conversationMap.get(convId)!.push(msg);
    }

    const conversations: UnifiedConversationItem[] = [];

    for (const [convId, msgList] of conversationMap.entries()) {
      const latestMsg = msgList[0];
      const customerMsg = msgList.find((m) => m.direction === 'INBOUND') || latestMsg;

      const recipientId =
        latestMsg.direction === 'INBOUND'
          ? latestMsg.senderId
          : latestMsg.recipientId || latestMsg.senderId;

      const customerName = customerMsg.senderName || 'Omnichannel User';

      // Check if matching customer exists in CRM
      let customerId: string | undefined;
      if (customerMsg.platform === 'whatsapp') {
        const cleanPhone = recipientId.replace(/[^0-9]/g, '');
        const matchedCust = await this.customerRepo.findOne({
          where: { tenantId, phone: cleanPhone },
        });
        customerId = matchedCust?.id;
      }

      const unreadCount = msgList.filter(
        (m) => m.direction === 'INBOUND' && m.status === 'RECEIVED',
      ).length;

      const platformLabelMap: Record<string, string> = {
        whatsapp: `WhatsApp (+${recipientId})`,
        telegram: `Telegram (Chat ID: ${recipientId})`,
        facebook: `Facebook Messenger (PSID: ${recipientId})`,
        instagram: `Instagram Direct (@${recipientId})`,
        x: `X / Twitter DM`,
        slack: `Slack Channel`,
      };

      const tagMap: Record<string, string[]> = {
        whatsapp: ['WhatsApp Business', 'Inbound'],
        telegram: ['Telegram Bot', 'Live Chat'],
        facebook: ['Messenger', 'Meta Page'],
        instagram: ['Instagram Direct', 'Direct Message'],
        x: ['Twitter/X'],
        slack: ['Internal'],
      };

      const convState = stateMap.get(convId);

      conversations.push({
        id: convId,
        customerName,
        avatarUrl:
          customerMsg.senderAvatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=0D9488&color=fff&bold=true&size=128&rounded=true`,
        platform: latestMsg.platform,
        platformDetail: platformLabelMap[latestMsg.platform] || `${latestMsg.platform} - ${recipientId}`,
        recipientId,
        lastMessage: latestMsg.text,
        timestamp: this.formatTimeAgo(latestMsg.createdAt),
        unreadCount,
        priority: unreadCount > 0 ? 'high' : 'medium',
        tags: tagMap[latestMsg.platform] || [latestMsg.platform],
        status: unreadCount > 0 ? 'unread' : 'all',
        customerId,
        isAiPaused: convState?.isAiPaused ?? false,
        pausedReason: convState?.pausedReason,
      });
    }

    // Apply search filter if provided
    let results = conversations;
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q) ||
          c.recipientId.toLowerCase().includes(q),
      );
    }

    return results;
  }

  async getMessagesByConversation(
    tenantId: string,
    conversationId: string,
  ): Promise<ConversationMessageItem[]> {
    const records = await this.messageRepo.find({
      where: { tenantId, conversationId },
      order: { createdAt: 'ASC' },
    });

    return records.map((r) => {
      const isAi = Boolean(r.rawMetadata?.isAiGenerated || r.rawMetadata?.senderType === 'ai');
      return {
        id: r.id,
        sender: r.direction === 'OUTBOUND' ? 'agent' : 'customer',
        senderName: r.senderName,
        senderAvatar: r.senderAvatar,
        text: r.text,
        timestamp: this.formatTimeAgo(r.createdAt),
        platform: r.platform,
        status: r.status.toLowerCase() as any,
        type: r.type,
        senderType: isAi ? 'ai' : (r.direction === 'OUTBOUND' ? 'agent' : 'customer'),
        isAiGenerated: isAi,
        aiMetadata: isAi ? r.rawMetadata : undefined,
      };
    });
  }

  async sendMessage(
    tenantId: string,
    platform: OmnichannelPlatformType,
    recipientId: string,
    text: string,
    storeId?: string,
  ): Promise<any> {
    if (!platform || !recipientId || !text) {
      throw new BadRequestException('platform, recipientId, and text are required');
    }

    // Determine conversation ID based on platform convention
    let convId = `${platform}-${recipientId}`;
    if (platform === 'whatsapp') {
      convId = `wa-${recipientId}`;
    } else if (platform === 'telegram') {
      convId = `tg-${recipientId}`;
    } else if (platform === 'facebook') {
      convId = `fb-${recipientId}`;
    } else if (platform === 'instagram') {
      convId = `ig-${recipientId}`;
    }

    // Automatically pause AI auto-reply for this conversation (human agent takeover)
    try {
      await this.aiAutoReplyService.onHumanAgentMessage(tenantId, convId, 'dashboard_agent');
    } catch (err: any) {
      this.logger.warn(`Failed to auto-pause AI for conversation ${convId}: ${err.message}`);
    }

    switch (platform) {
      case 'telegram':
        return this.telegramService.sendMessage(tenantId, recipientId, text, storeId);
      case 'whatsapp':
        return this.whatsappService.sendMessage(tenantId, recipientId, text, storeId);
      case 'facebook':
        return this.facebookService.sendMessage(tenantId, recipientId, text, storeId);
      case 'instagram':
        return this.instagramService.sendMessage(tenantId, recipientId, text, storeId);
      default: {
        // Generic fallback for custom/other platforms: save to DB directly
        const record = this.messageRepo.create({
          tenantId,
          storeId,
          platform,
          conversationId: convId,
          externalMessageId: `custom-out-${Date.now()}`,
          senderId: 'agent',
          senderName: 'Merchant Agent',
          recipientId,
          text,
          direction: 'OUTBOUND',
          status: 'DELIVERED',
          type: 'text',
        });
        await this.messageRepo.save(record);
        return {
          success: true,
          message: `Message logged for ${platform} recipient ${recipientId}`,
        };
      }
    }
  }

  private formatTimeAgo(dateInput: Date | string): string {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-BD', { day: 'numeric', month: 'short' });
  }

  /**
   * Sync existing past conversations from external platform (Facebook Messenger, Instagram Direct, etc.)
   */
  async syncPlatformConversations(
    tenantId: string,
    platform: string,
    storeId?: string,
  ): Promise<{ success: boolean; message: string; count?: number }> {
    if (platform === 'facebook') {
      const res = await this.facebookService.syncPreviousConversations(tenantId, storeId);
      return {
        success: true,
        message: res.message,
        count: res.syncedConversations,
      };
    }
    return {
      success: true,
      message: `Sync completed for ${platform}.`,
      count: 0,
    };
  }
}
