import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelAiConfigEntity } from '../entities/omnichannel-ai-config.entity';
import {
  OmnichannelConversationStateEntity,
  AiPausedReason,
} from '../entities/omnichannel-conversation-state.entity';
import { OmnichannelAiLogEntity } from '../entities/omnichannel-ai-log.entity';
import { OmnichannelMessageEntity } from '../entities/omnichannel-message.entity';
import { OmnichannelPlatformType } from '../entities/omnichannel-credential.entity';
import { OmnichannelAiCryptoService } from './omnichannel-ai-crypto.service';
import { GeminiAiProvider } from './ai-providers/gemini-ai.provider';
import { OpenAiProvider } from './ai-providers/openai-ai.provider';
import { TelegramChannelService } from './telegram-channel.service';
import { WhatsAppChannelService } from './whatsapp-channel.service';
import { FacebookChannelService } from './facebook-channel.service';
import { InstagramChannelService } from './instagram-channel.service';

export interface InboundMessageAiContext {
  tenantId: string;
  storeId?: string;
  platform: OmnichannelPlatformType;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  recipientId?: string;
}

@Injectable()
export class OmnichannelAiAutoReplyService {
  private readonly logger = new Logger(OmnichannelAiAutoReplyService.name);

  constructor(
    @InjectRepository(OmnichannelAiConfigEntity)
    private readonly configRepo: Repository<OmnichannelAiConfigEntity>,
    @InjectRepository(OmnichannelConversationStateEntity)
    private readonly stateRepo: Repository<OmnichannelConversationStateEntity>,
    @InjectRepository(OmnichannelAiLogEntity)
    private readonly logRepo: Repository<OmnichannelAiLogEntity>,
    @InjectRepository(OmnichannelMessageEntity)
    private readonly messageRepo: Repository<OmnichannelMessageEntity>,
    private readonly cryptoService: OmnichannelAiCryptoService,
    private readonly geminiProvider: GeminiAiProvider,
    private readonly openAiProvider: OpenAiProvider,
    @Inject(forwardRef(() => TelegramChannelService))
    private readonly telegramService: TelegramChannelService,
    @Inject(forwardRef(() => WhatsAppChannelService))
    private readonly whatsappService: WhatsAppChannelService,
    @Inject(forwardRef(() => FacebookChannelService))
    private readonly facebookService: FacebookChannelService,
    @Inject(forwardRef(() => InstagramChannelService))
    private readonly instagramService: InstagramChannelService,
  ) {}

  /**
   * Process inbound customer messages and trigger AI Auto-Reply if conditions are met.
   */
  async handleInboundMessage(ctx: InboundMessageAiContext): Promise<boolean> {
    const { tenantId, conversationId, platform, senderId, senderName, text, storeId } = ctx;

    // 1. Fetch Tenant AI Configuration
    const config = await this.configRepo.findOne({ where: { tenantId } });
    if (!config || !config.isEnabled) {
      return false;
    }

    const apiKey = this.cryptoService.decrypt(config.encryptedApiKey);
    if (!apiKey) {
      this.logger.warn(`AI Auto-Reply enabled for tenant ${tenantId} but no valid API Key configured.`);
      return false;
    }

    // 2. Fetch or initialize conversation state
    let state = await this.stateRepo.findOne({ where: { tenantId, conversationId } });
    if (!state) {
      state = this.stateRepo.create({
        tenantId,
        conversationId,
        isAiPaused: false,
        pausedReason: 'NONE',
      });
      state = await this.stateRepo.save(state);
    }

    // 3. Check Conversation Pause Condition
    if (state.isAiPaused) {
      await this.logRepo.save(
        this.logRepo.create({
          tenantId,
          conversationId,
          platform,
          provider: config.provider,
          model: config.model,
          userQuery: text,
          status: 'SKIPPED_PAUSED',
          errorMessage: `AI Auto-reply skipped: paused by ${state.pausedReason}`,
        }),
      );
      return false;
    }

    // 4. Trigger Mode & Human Activity Check
    if (config.triggerMode === 'NO_HUMAN_ACTIVE' && state.lastHumanAgentMessageAt) {
      const msSinceHumanReply = Date.now() - new Date(state.lastHumanAgentMessageAt).getTime();
      const thirtyMinutesMs = 30 * 60 * 1000;
      if (msSinceHumanReply < thirtyMinutesMs) {
        await this.logRepo.save(
          this.logRepo.create({
            tenantId,
            conversationId,
            platform,
            provider: config.provider,
            model: config.model,
            userQuery: text,
            status: 'SKIPPED_AGENT_ACTIVE',
            errorMessage: 'AI Auto-reply skipped: human agent was active within 30m.',
          }),
        );
        return false;
      }
    }

    // 5. Gather Recent Conversation History (last 10 messages)
    const recentMessages = await this.messageRepo.find({
      where: { tenantId, conversationId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Chronological order (oldest to newest)
    const sorted = recentMessages.reverse();
    const history = sorted.map((m) => ({
      role: (m.direction === 'OUTBOUND' ? 'model' : 'user') as 'model' | 'user',
      text: m.text,
    }));

    // Remove the current latest message from history if already saved
    if (history.length > 0 && history[history.length - 1].text === text) {
      history.pop();
    }

    const provider = config.provider === 'openai' ? this.openAiProvider : this.geminiProvider;

    try {
      this.logger.log(`Generating AI Auto-Reply for tenant ${tenantId} via ${config.provider} (${config.model})...`);

      const result = await provider.generateReply({
        apiKey,
        model: config.model,
        systemPrompt: config.systemPrompt,
        history,
        latestMessage: text,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        businessContext: config.businessContext,
      });

      // 6. Save AI message record with metadata
      const aiMessageRecord = this.messageRepo.create({
        tenantId,
        storeId,
        platform,
        conversationId,
        externalMessageId: `ai-reply-${Date.now()}`,
        senderId: 'ai_assistant',
        senderName: 'AI Support Assistant',
        senderAvatar: 'https://ui-avatars.com/api/?name=AI+Bot&background=0D9488&color=fff&bold=true&size=128&rounded=true',
        recipientId: senderId,
        text: result.reply,
        direction: 'OUTBOUND',
        status: 'DELIVERED',
        type: 'text',
        rawMetadata: {
          senderType: 'ai',
          isAiGenerated: true,
          provider: result.provider,
          model: result.model,
          tokensUsed: result.tokensUsed,
          latencyMs: result.latencyMs,
        },
      });

      await this.messageRepo.save(aiMessageRecord);

      // 7. Deliver to external channel
      await this.deliverOutboundReply(tenantId, platform, senderId, result.reply, storeId);

      // 8. Update conversation state & log audit record
      state.lastAiMessageAt = new Date();
      state.totalAiRepliesCount = (state.totalAiRepliesCount || 0) + 1;
      await this.stateRepo.save(state);

      await this.logRepo.save(
        this.logRepo.create({
          tenantId,
          conversationId,
          platform,
          provider: config.provider,
          model: config.model,
          userQuery: text,
          aiResponse: result.reply,
          status: 'SUCCESS',
          tokensUsed: result.tokensUsed,
          latencyMs: result.latencyMs,
        }),
      );

      return true;
    } catch (error: any) {
      this.logger.error(`AI Auto-Reply execution failed for conversation ${conversationId}: ${error.message}`);

      await this.logRepo.save(
        this.logRepo.create({
          tenantId,
          conversationId,
          platform,
          provider: config.provider,
          model: config.model,
          userQuery: text,
          status: 'FAILED',
          errorMessage: error.message,
        }),
      );

      return false;
    }
  }

  /**
   * Hook called whenever a human agent sends a message from the merchant dashboard.
   * Automatically pauses AI to prevent interrupting human support.
   */
  async onHumanAgentMessage(
    tenantId: string,
    conversationId: string,
    agentUserId?: string,
  ): Promise<void> {
    let state = await this.stateRepo.findOne({ where: { tenantId, conversationId } });
    if (!state) {
      state = this.stateRepo.create({ tenantId, conversationId });
    }

    state.lastHumanAgentMessageAt = new Date();
    state.isAiPaused = true;
    state.pausedReason = 'HUMAN_AGENT_TAKEOVER';
    state.pausedByUserId = agentUserId || 'dashboard_agent';
    state.aiPausedAt = new Date();

    await this.stateRepo.save(state);
    this.logger.log(`AI Auto-Reply automatically paused for conversation ${conversationId} (Human Agent Takeover).`);
  }

  /**
   * Manual toggle for agent in chat UI (Pause or Resume AI).
   */
  async toggleConversationAiState(
    tenantId: string,
    conversationId: string,
    isPaused: boolean,
    userId?: string,
  ): Promise<OmnichannelConversationStateEntity> {
    let state = await this.stateRepo.findOne({ where: { tenantId, conversationId } });
    if (!state) {
      state = this.stateRepo.create({ tenantId, conversationId });
    }

    state.isAiPaused = isPaused;
    state.pausedReason = isPaused ? 'AGENT_MANUAL' : 'NONE';
    state.pausedByUserId = userId || 'agent';
    if (isPaused) {
      state.aiPausedAt = new Date();
    } else {
      state.aiPausedAt = undefined as any;
    }

    return this.stateRepo.save(state);
  }

  /**
   * Fetch conversation AI status.
   */
  async getConversationAiState(
    tenantId: string,
    conversationId: string,
  ): Promise<OmnichannelConversationStateEntity> {
    let state = await this.stateRepo.findOne({ where: { tenantId, conversationId } });
    if (!state) {
      state = this.stateRepo.create({
        tenantId,
        conversationId,
        isAiPaused: false,
        pausedReason: 'NONE',
      });
      state = await this.stateRepo.save(state);
    }
    return state;
  }

  private async deliverOutboundReply(
    tenantId: string,
    platform: OmnichannelPlatformType,
    recipientId: string,
    text: string,
    storeId?: string,
  ): Promise<void> {
    try {
      if (platform === 'whatsapp') {
        await this.whatsappService.sendMessage(tenantId, recipientId, text, storeId);
      } else if (platform === 'telegram') {
        await this.telegramService.sendMessage(tenantId, recipientId, text, storeId);
      } else if (platform === 'instagram') {
        await this.instagramService.sendMessage(tenantId, recipientId, text, storeId);
      } else if (platform === 'facebook') {
        await this.facebookService.sendMessage(tenantId, recipientId, text, storeId);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to deliver external message to ${platform} recipient ${recipientId}: ${err.message}`);
    }
  }
}
