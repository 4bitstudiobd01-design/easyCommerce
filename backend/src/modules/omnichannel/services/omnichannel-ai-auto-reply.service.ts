import {
  Injectable,
  Logger,
  forwardRef,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelAiConfigEntity, AiProviderType } from '../entities/omnichannel-ai-config.entity';
import {
  OmnichannelConversationStateEntity,
  AiPausedReason,
} from '../entities/omnichannel-conversation-state.entity';
import { OmnichannelAiLogEntity } from '../entities/omnichannel-ai-log.entity';
import { OmnichannelMessageEntity } from '../entities/omnichannel-message.entity';
import { OmnichannelPlatformType } from '../entities/omnichannel-credential.entity';
import { OmnichannelAiCryptoService } from './omnichannel-ai-crypto.service';
import { OmnichannelAiConfigService } from './omnichannel-ai-config.service';
import { GeminiAiProvider } from './ai-providers/gemini-ai.provider';
import { OpenAiProvider } from './ai-providers/openai-ai.provider';
import { ClaudeAiProvider } from './ai-providers/claude-ai.provider';
import { TelegramChannelService } from './telegram-channel.service';
import { WhatsAppChannelService } from './whatsapp-channel.service';
import { FacebookChannelService } from './facebook-channel.service';
import { InstagramChannelService } from './instagram-channel.service';
import { TikTokChannelService } from './tiktok-channel.service';

import { OmnichannelAiRagService } from './omnichannel-ai-rag.service';
import { OmnichannelAiToolsService } from './omnichannel-ai-tools.service';

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
    private readonly aiConfigService: OmnichannelAiConfigService,
    private readonly geminiProvider: GeminiAiProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly claudeProvider: ClaudeAiProvider,
    private readonly ragService: OmnichannelAiRagService,
    private readonly toolsService: OmnichannelAiToolsService,
    @Inject(forwardRef(() => TelegramChannelService))
    private readonly telegramService: TelegramChannelService,
    @Inject(forwardRef(() => WhatsAppChannelService))
    private readonly whatsappService: WhatsAppChannelService,
    @Inject(forwardRef(() => FacebookChannelService))
    private readonly facebookService: FacebookChannelService,
    @Inject(forwardRef(() => InstagramChannelService))
    private readonly instagramService: InstagramChannelService,
    @Inject(forwardRef(() => TikTokChannelService))
    private readonly tiktokService: TikTokChannelService,
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

    // Check Per-Platform Enablement
    if (config.enabledPlatforms && config.enabledPlatforms[platform] === false) {
      this.logger.log(`AI Auto-Reply skipped for platform "${platform}" (disabled in AI Settings).`);
      return false;
    }

    // Resolve the key for the active provider with auto-fallback
    let activeProvider: AiProviderType = (config.provider || 'gemini') as AiProviderType;
    let apiKey = this.aiConfigService.getDecryptedKeyForProvider(config, activeProvider);

    if (!apiKey) {
      const allProviders: AiProviderType[] = ['openai', 'gemini', 'claude', 'deepseek', 'groq'];
      for (const p of allProviders) {
        const candidateKey = this.aiConfigService.getDecryptedKeyForProvider(config, p);
        if (candidateKey) {
          activeProvider = p;
          apiKey = candidateKey;
          break;
        }
      }
    }

    if (!apiKey) {
      this.logger.warn(
        `AI Auto-Reply enabled for tenant ${tenantId} but no valid API Key configured for any provider. Please add a key in Channel Settings.`,
      );
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
      if (state.pausedReason === 'AGENT_MANUAL') {
        // Explicitly paused by an agent clicking "Pause AI" in the UI
        await this.logRepo.save(
          this.logRepo.create({
            tenantId,
            conversationId,
            platform,
            provider: config.provider,
            model: config.model,
            userQuery: text,
            status: 'SKIPPED_PAUSED',
            errorMessage: `AI Auto-reply skipped: explicitly paused by agent`,
          }),
        );
        return false;
      }

      if (config.triggerMode === 'ALWAYS') {
        // In ALWAYS mode, incoming customer messages automatically resume AI auto-replies
        state.isAiPaused = false;
        state.pausedReason = 'NONE';
        await this.stateRepo.save(state);
      } else {
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

    try {
      this.logger.log(`Generating AI Auto-Reply for tenant ${tenantId} via ${activeProvider} (${config.model})...`);

      const enrichedContext = await this.enrichStoreContext(
        tenantId,
        storeId || config.storeId,
        text,
        apiKey,
        activeProvider === 'openai' ? 'openai' : 'gemini',
        config.businessContext,
      );

      let result: any = null;
      let usedProvider = activeProvider;
      let usedModel = config.model;

      try {
        result = await this.executeProviderReply({
          provider: activeProvider,
          apiKey,
          model: config.model,
          systemPrompt: config.systemPrompt,
          history,
          latestMessage: text,
          temperature: config.temperature,
          maxTokens: Math.max(config.maxTokens || 500, 800),
          businessContext: enrichedContext,
        });
      } catch (primaryErr: any) {
        this.logger.warn(
          `Primary provider ${activeProvider} failed: ${primaryErr.message}. Attempting provider fallback...`,
        );

        // Try other configured providers
        const otherProviders: AiProviderType[] = (['gemini', 'openai', 'claude', 'deepseek', 'groq'] as AiProviderType[]).filter(
          (p) => p !== activeProvider,
        );

        for (const fallbackP of otherProviders) {
          const fallbackKey = this.aiConfigService.getDecryptedKeyForProvider(config, fallbackP);
          if (fallbackKey) {
            try {
              this.logger.log(`Attempting fallback to ${fallbackP}...`);
              const defaultFallbackModel =
                fallbackP === 'gemini'
                  ? 'gemini-2.5-flash'
                  : fallbackP === 'openai'
                  ? 'gpt-4o-mini'
                  : fallbackP === 'claude'
                  ? 'claude-3-5-haiku-20241022'
                  : fallbackP === 'deepseek'
                  ? 'deepseek-chat'
                  : 'llama-3.3-70b-versatile';

              result = await this.executeProviderReply({
                provider: fallbackP,
                apiKey: fallbackKey,
                model: defaultFallbackModel,
                systemPrompt: config.systemPrompt,
                history,
                latestMessage: text,
                temperature: config.temperature,
                maxTokens: Math.max(config.maxTokens || 500, 800),
                businessContext: enrichedContext,
              });

              usedProvider = fallbackP;
              usedModel = defaultFallbackModel;
              this.logger.log(`Fallback to ${fallbackP} succeeded!`);
              break;
            } catch (fallbackErr: any) {
              this.logger.warn(`Fallback to ${fallbackP} also failed: ${fallbackErr.message}`);
            }
          }
        }

        if (!result) {
          throw primaryErr;
        }
      }

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
          provider: usedProvider,
          model: usedModel,
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

    const config = await this.configRepo.findOne({ where: { tenantId } });
    if (config?.triggerMode === 'NO_HUMAN_ACTIVE') {
      state.isAiPaused = true;
      state.pausedReason = 'HUMAN_AGENT_TAKEOVER';
      state.pausedByUserId = agentUserId || 'dashboard_agent';
      state.aiPausedAt = new Date();
      this.logger.log(`AI Auto-Reply paused for conversation ${conversationId} (Human Agent Takeover).`);
    } else {
      this.logger.log(`Human agent message sent in ALWAYS mode for conversation ${conversationId}.`);
    }

    await this.stateRepo.save(state);
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

  /**
   * Generate an on-demand AI Draft reply for a merchant agent to review, edit, or insert into the chat composer.
   */
  async generateDraftReply(
    tenantId: string,
    conversationId: string,
    promptOverride?: string,
    providerOverride?: string,
    modelOverride?: string,
  ): Promise<{
    success: boolean;
    reply: string;
    model: string;
    provider: string;
    latencyMs: number;
    tokensUsed: number;
  }> {
    const config = await this.configRepo.findOne({ where: { tenantId } });
    if (!config) {
      throw new BadRequestException(
        'AI is not configured for this store. Please add an API Key in Channel Settings → AI Configuration.',
      );
    }

    // Determine active provider: explicit override -> config.provider -> first provider with key
    let targetProvider: AiProviderType = (providerOverride || config.provider || 'openai') as AiProviderType;
    let apiKey = this.aiConfigService.getDecryptedKeyForProvider(config, targetProvider);

    // If requested provider has no key, look for any provider that has a valid key
    if (!apiKey) {
      const allProviders: AiProviderType[] = ['openai', 'gemini', 'claude', 'deepseek', 'groq'];
      for (const p of allProviders) {
        const candidateKey = this.aiConfigService.getDecryptedKeyForProvider(config, p);
        if (candidateKey) {
          targetProvider = p;
          apiKey = candidateKey;
          break;
        }
      }
    }

    if (!apiKey) {
      throw new BadRequestException(
        `No active AI API key found. Please add an API key (OpenAI, Gemini, Claude, DeepSeek, or Groq) in Channel Settings → AI Configuration.`,
      );
    }

    // Gather recent messages for context
    const recentMessages = await this.messageRepo.find({
      where: { tenantId, conversationId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (recentMessages.length === 0) {
      throw new BadRequestException('No conversation history found to draft a reply.');
    }

    const sorted = recentMessages.reverse();
    const latestMsg = sorted[sorted.length - 1];
    const previousHistory = sorted.slice(0, sorted.length - 1).map((m) => ({
      role: (m.direction === 'OUTBOUND' ? 'model' : 'user') as 'model' | 'user',
      text: m.text,
    }));

    const systemPrompt = promptOverride || config.systemPrompt;
    const defaultModel = targetProvider === 'openai' ? 'gpt-4o-mini' : targetProvider === 'gemini' ? 'gemini-2.5-flash' : targetProvider === 'claude' ? 'claude-3-5-haiku-20241022' : targetProvider === 'deepseek' ? 'deepseek-chat' : 'llama-3.3-70b-versatile';
    const targetModel = modelOverride || (targetProvider === config.provider ? config.model : undefined) || defaultModel;

    const enrichedContext = await this.enrichStoreContext(
      tenantId,
      config.storeId,
      latestMsg.text,
      apiKey,
      targetProvider === 'openai' ? 'openai' : 'gemini',
      config.businessContext,
    );

    const result = await this.executeProviderReply({
      provider: targetProvider,
      apiKey,
      model: targetModel,
      systemPrompt,
      history: previousHistory,
      latestMessage: latestMsg.text,
      temperature: config.temperature || 0.7,
      maxTokens: Math.max(config.maxTokens || 500, 800),
      businessContext: enrichedContext,
    });

    return {
      success: true,
      reply: result.reply,
      model: result.model,
      provider: result.provider,
      latencyMs: result.latencyMs,
      tokensUsed: result.tokensUsed,
    };
  }

  /**
   * Helper to enrich AI context with store-isolated RAG chunks and real-time live product/order lookups.
   */
  private async enrichStoreContext(
    tenantId: string,
    storeId?: string,
    query?: string,
    apiKey?: string,
    provider: 'gemini' | 'openai' = 'gemini',
    existingContext?: Record<string, any>,
  ): Promise<Record<string, any>> {
    const enriched: Record<string, any> = { ...(existingContext || {}) };

    if (!query || !query.trim()) return enriched;

    // 1. Multi-Tenant RAG Knowledge Base Search
    try {
      const ragChunks = await this.ragService.searchRelevantChunks(
        tenantId,
        storeId || '',
        query,
        3,
        apiKey,
        provider,
      );
      if (ragChunks.length > 0) {
        enriched.storePolicyAndKnowledgeBase = ragChunks.map(
          (c) => `[Source Document: ${c.documentName}] ${c.content}`,
        );
      }
    } catch (e: any) {
      this.logger.warn(`RAG context enrichment failed: ${e.message}`);
    }

    // 2. Real-time Order Tracking Lookup
    const orderMatch = query.match(/\b(ORD-\d+|01[3-9]\d{8})\b/i);
    if (orderMatch) {
      try {
        const orderRes = await this.toolsService.executeTool(
          'track_customer_order',
          {
            orderNumber: orderMatch[1].toUpperCase().startsWith('ORD') ? orderMatch[1] : undefined,
            phoneNumber: !orderMatch[1].toUpperCase().startsWith('ORD') ? orderMatch[1] : undefined,
          },
          tenantId,
          storeId,
        );
        if (orderRes.found && orderRes.orders?.length > 0) {
          enriched.liveCustomerOrderLookup = orderRes.orders;
        }
      } catch (e: any) {
        this.logger.warn(`Order tool enrichment failed: ${e.message}`);
      }
    }

    // 3. Real-time Product & Inventory Stock Lookup
    try {
      const productRes = await this.toolsService.executeTool(
        'search_product_inventory',
        { query },
        tenantId,
        storeId,
      );
      if (productRes.found && productRes.products?.length > 0) {
        enriched.liveStoreProductsAndInventory = {
          totalProductsCount: productRes.count,
          products: productRes.products,
        };
      }
    } catch (e: any) {
      this.logger.warn(`Product tool enrichment failed: ${e.message}`);
    }

    return enriched;
  }

  private async executeProviderReply(
    params: {
      provider?: string;
      apiKey: string;
      model: string;
      systemPrompt: string;
      history: any[];
      latestMessage: string;
      temperature?: number;
      maxTokens?: number;
      businessContext?: any;
    },
  ) {
    const provider = params.provider || 'gemini';
    if (provider === 'gemini') {
      return this.geminiProvider.generateReply(params);
    }
    if (provider === 'claude') {
      return this.claudeProvider.generateReply(params);
    }
    return this.openAiProvider.generateReply({
      ...params,
      providerType: provider as 'openai' | 'deepseek' | 'groq',
    });
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
        await this.telegramService.sendMessage(tenantId, recipientId, text, storeId, {
          skipDbSave: true,
        });
      } else if (platform === 'instagram') {
        await this.instagramService.sendMessage(tenantId, recipientId, text, storeId);
      } else if (platform === 'facebook') {
        await this.facebookService.sendMessage(tenantId, recipientId, text, storeId, {
          skipDbSave: true,
        });
      } else if (platform === 'tiktok') {
        await this.tiktokService.sendMessage(tenantId, recipientId, text, storeId, {
          skipDbSave: true,
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to deliver external message to ${platform} recipient ${recipientId}: ${err.message}`);
    }
  }
}
