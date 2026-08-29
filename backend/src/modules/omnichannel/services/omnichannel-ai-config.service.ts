import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelAiConfigEntity, AiProviderType } from '../entities/omnichannel-ai-config.entity';
import { OmnichannelAiLogEntity } from '../entities/omnichannel-ai-log.entity';
import { OmnichannelAiCryptoService } from './omnichannel-ai-crypto.service';
import { GeminiAiProvider } from './ai-providers/gemini-ai.provider';
import { OpenAiProvider } from './ai-providers/openai-ai.provider';
import { ClaudeAiProvider } from './ai-providers/claude-ai.provider';
import { SaveAiConfigDto, TestAiConnectionDto } from '../dto/omnichannel-ai.dto';

/** Map provider type → entity column name for encrypted key storage */
const PROVIDER_KEY_COLUMN: Record<AiProviderType, keyof OmnichannelAiConfigEntity> = {
  gemini: 'encryptedGeminiKey',
  openai: 'encryptedOpenaiKey',
  claude: 'encryptedClaudeKey',
  deepseek: 'encryptedDeepseekKey',
  groq: 'encryptedGroqKey',
};

/** Default model per provider */
const PROVIDER_DEFAULT_MODEL: Record<AiProviderType, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  claude: 'claude-3-5-haiku-20241022',
  deepseek: 'deepseek-chat',
  groq: 'llama-3.3-70b-versatile',
};

@Injectable()
export class OmnichannelAiConfigService {
  private readonly logger = new Logger(OmnichannelAiConfigService.name);

  constructor(
    @InjectRepository(OmnichannelAiConfigEntity)
    private readonly configRepo: Repository<OmnichannelAiConfigEntity>,
    @InjectRepository(OmnichannelAiLogEntity)
    private readonly logRepo: Repository<OmnichannelAiLogEntity>,
    private readonly cryptoService: OmnichannelAiCryptoService,
    private readonly geminiProvider: GeminiAiProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly claudeProvider: ClaudeAiProvider,
  ) {}

  /** Decrypt and mask the stored key for a given provider */
  private getProviderKeyStatus(
    config: OmnichannelAiConfigEntity,
    provider: AiProviderType,
  ): { apiKeyMasked: string; hasApiKey: boolean } {
    const col = PROVIDER_KEY_COLUMN[provider];
    const encryptedVal = config[col] as string | null | undefined;

    // Fall back to legacy single-key column for migration
    const encrypted = encryptedVal || (provider === config.provider ? config.encryptedApiKey : null);

    if (!encrypted) return { apiKeyMasked: '', hasApiKey: false };
    const raw = this.cryptoService.decrypt(encrypted);
    return {
      apiKeyMasked: raw ? this.cryptoService.maskKey(raw) : '',
      hasApiKey: Boolean(raw),
    };
  }

  /** Get decrypted key for a specific provider (for internal use by test/reply services) */
  getDecryptedKeyForProvider(
    config: OmnichannelAiConfigEntity,
    provider: AiProviderType,
  ): string | null {
    const col = PROVIDER_KEY_COLUMN[provider];
    const encryptedVal = config[col] as string | null | undefined;
    const encrypted = encryptedVal || (provider === config.provider ? config.encryptedApiKey : null);
    if (!encrypted) return null;
    return this.cryptoService.decrypt(encrypted);
  }

  /** Get raw entity for internal service use */
  async getRawConfig(tenantId: string): Promise<OmnichannelAiConfigEntity | null> {
    return this.configRepo.findOne({ where: { tenantId } });
  }

  /** Retrieve and decrypt the active or available API key for the tenant */
  async getDecryptedApiKeyForTenant(
    tenantId: string,
    preferredProvider?: AiProviderType,
  ): Promise<{ apiKey: string | null; provider: AiProviderType }> {
    const config = await this.getRawConfig(tenantId);
    if (!config) {
      return { apiKey: null, provider: preferredProvider || 'gemini' };
    }
    const provider = preferredProvider || config.provider || 'gemini';
    const primaryKey = this.getDecryptedKeyForProvider(config, provider);
    if (primaryKey) {
      return { apiKey: primaryKey, provider };
    }
    // Fall back to any provider key present in the tenant config
    for (const p of Object.keys(PROVIDER_KEY_COLUMN) as AiProviderType[]) {
      const fallbackKey = this.getDecryptedKeyForProvider(config, p);
      if (fallbackKey) {
        return { apiKey: fallbackKey, provider: p };
      }
    }
    return { apiKey: null, provider };
  }

  async getConfig(tenantId: string): Promise<any> {
    const config = await this.configRepo.findOne({ where: { tenantId } });

    if (!config) {
      return {
        tenantId,
        isEnabled: false,
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        apiKeyMasked: '',
        hasApiKey: false,
        providerKeys: {
          gemini: { hasApiKey: false, apiKeyMasked: '' },
          openai: { hasApiKey: false, apiKeyMasked: '' },
          claude: { hasApiKey: false, apiKeyMasked: '' },
          deepseek: { hasApiKey: false, apiKeyMasked: '' },
          groq: { hasApiKey: false, apiKeyMasked: '' },
        },
        systemPrompt:
          'You are a helpful, professional, and friendly eCommerce customer support assistant for our store. Answer customer questions regarding products, orders, shipping, payment methods, and return policies accurately and concisely. If you do not know the answer, politely ask the customer to wait for a human support representative.',
        triggerMode: 'NO_HUMAN_ACTIVE',
        temperature: 0.7,
        maxTokens: 500,
        businessContext: {},
        enabledPlatforms: {
          telegram: true,
          whatsapp: true,
          instagram: true,
          facebook: true,
          x: true,
        },
      };
    }

    // Build per-provider key status map for frontend to show ✓ Key Saved per provider
    const providerKeys: Record<string, { hasApiKey: boolean; apiKeyMasked: string }> = {};
    for (const p of Object.keys(PROVIDER_KEY_COLUMN) as AiProviderType[]) {
      providerKeys[p] = this.getProviderKeyStatus(config, p);
    }

    const { apiKeyMasked, hasApiKey } = this.getProviderKeyStatus(config, config.provider);

    return {
      id: config.id,
      tenantId: config.tenantId,
      storeId: config.storeId,
      isEnabled: config.isEnabled,
      provider: config.provider,
      model: config.model,
      apiKeyMasked,
      hasApiKey,
      providerKeys,
      systemPrompt: config.systemPrompt,
      triggerMode: config.triggerMode,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      businessContext: config.businessContext || {},
      enabledPlatforms: config.enabledPlatforms || {
        telegram: true,
        whatsapp: true,
        instagram: true,
        facebook: true,
        x: true,
      },
      updatedAt: config.updatedAt,
    };
  }

  async saveConfig(tenantId: string, dto: SaveAiConfigDto, storeId?: string): Promise<any> {
    let config = await this.configRepo.findOne({ where: { tenantId } });

    if (!config) {
      config = this.configRepo.create({
        tenantId,
        storeId: storeId || undefined,
        isEnabled: dto.isEnabled ?? false,
        provider: dto.provider || 'gemini',
        model: dto.model || 'gemini-1.5-flash',
        systemPrompt: dto.systemPrompt,
        triggerMode: dto.triggerMode || 'NO_HUMAN_ACTIVE',
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 500,
        businessContext: dto.businessContext || {},
        enabledPlatforms: dto.enabledPlatforms || {
          telegram: true,
          whatsapp: true,
          instagram: true,
          facebook: true,
          x: true,
        },
      });
    } else {
      // Always keep storeId in sync
      if (storeId) config.storeId = storeId;
      if (dto.isEnabled !== undefined) config.isEnabled = dto.isEnabled;
      if (dto.provider) config.provider = dto.provider;
      if (dto.model) config.model = dto.model;
      if (dto.systemPrompt !== undefined) config.systemPrompt = dto.systemPrompt;
      if (dto.triggerMode) config.triggerMode = dto.triggerMode;
      if (dto.temperature !== undefined) config.temperature = dto.temperature;
      if (dto.maxTokens !== undefined) config.maxTokens = dto.maxTokens;
      if (dto.businessContext !== undefined) config.businessContext = dto.businessContext;
      if (dto.enabledPlatforms !== undefined) config.enabledPlatforms = dto.enabledPlatforms;
    }

    // Save API key into the correct provider-specific column
    if (dto.apiKey && typeof dto.apiKey === 'string') {
      const trimmed = dto.apiKey.trim();
      if (trimmed.length > 0 && !this.cryptoService.isMasked(trimmed)) {
        const targetProvider: AiProviderType = (dto.provider || config.provider || 'gemini') as AiProviderType;
        const col = PROVIDER_KEY_COLUMN[targetProvider];
        (config as any)[col] = this.cryptoService.encrypt(trimmed);
        // Keep legacy column in sync for backward-compatibility
        config.encryptedApiKey = this.cryptoService.encrypt(trimmed);
        this.logger.log(`[Tenant: ${tenantId}] Saved encrypted key for provider: ${targetProvider}`);
      }
    }

    const saved = await this.configRepo.save(config);
    return this.getConfig(saved.tenantId);
  }

  async testConnection(tenantId: string, dto: TestAiConnectionDto, storeId?: string): Promise<any> {
    const providerType = (dto.provider || 'gemini') as AiProviderType;
    const model = dto.model || PROVIDER_DEFAULT_MODEL[providerType];

    let keyToTest: string | null = null;

    if (dto.apiKey && typeof dto.apiKey === 'string' && dto.apiKey.trim().length > 0 && !this.cryptoService.isMasked(dto.apiKey)) {
      // Fresh key provided directly — use it
      keyToTest = dto.apiKey.trim();
    } else {
      // Look up stored key for this specific provider from the DB
      const stored = await this.configRepo.findOne({ where: { tenantId } });
      if (stored) {
        keyToTest = this.getDecryptedKeyForProvider(stored, providerType);
      }
    }

    if (!keyToTest) {
      return {
        success: false,
        message: `No ${providerType.toUpperCase()} API Key found. Please enter your API key in the field above and save it first.`,
        latencyMs: 0,
        model,
      };
    }

    try {
      if (providerType === 'gemini') {
        return this.geminiProvider.testConnection(keyToTest, model);
      } else if (providerType === 'claude') {
        return this.claudeProvider.testConnection(keyToTest, model);
      } else {
        return this.openAiProvider.testConnection(
          keyToTest,
          model,
          providerType as 'openai' | 'deepseek' | 'groq',
        );
      }
    } catch (error: any) {
      const errorMsg = error?.message || 'Connection test failed';
      return {
        success: false,
        message: `${providerType.toUpperCase()} connection error: ${errorMsg}`,
        latencyMs: 0,
        model,
      };
    }
  }

  async getLogs(tenantId: string, limit = 50): Promise<OmnichannelAiLogEntity[]> {
    return this.logRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
    });
  }
}
