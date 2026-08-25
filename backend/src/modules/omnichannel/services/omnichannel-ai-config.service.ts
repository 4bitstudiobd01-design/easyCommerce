import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OmnichannelAiConfigEntity } from '../entities/omnichannel-ai-config.entity';
import { OmnichannelAiLogEntity } from '../entities/omnichannel-ai-log.entity';
import { OmnichannelAiCryptoService } from './omnichannel-ai-crypto.service';
import { GeminiAiProvider } from './ai-providers/gemini-ai.provider';
import { OpenAiProvider } from './ai-providers/openai-ai.provider';
import { SaveAiConfigDto, TestAiConnectionDto } from '../dto/omnichannel-ai.dto';

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
  ) {}

  async getConfig(tenantId: string): Promise<any> {
    let config = await this.configRepo.findOne({ where: { tenantId } });

    if (!config) {
      // Return default configuration template if not yet saved
      return {
        tenantId,
        isEnabled: false,
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        apiKeyMasked: '',
        hasApiKey: false,
        systemPrompt:
          'You are a helpful, professional, and friendly eCommerce customer support assistant for our store. Answer customer questions regarding products, orders, shipping, payment methods, and return policies accurately and concisely. If you do not know the answer, politely ask the customer to wait for a human support representative.',
        triggerMode: 'NO_HUMAN_ACTIVE',
        temperature: 0.7,
        maxTokens: 500,
        businessContext: {},
      };
    }

    const rawKey = this.cryptoService.decrypt(config.encryptedApiKey);
    const apiKeyMasked = rawKey ? this.cryptoService.maskKey(rawKey) : '';

    return {
      id: config.id,
      tenantId: config.tenantId,
      storeId: config.storeId,
      isEnabled: config.isEnabled,
      provider: config.provider,
      model: config.model,
      apiKeyMasked,
      hasApiKey: Boolean(config.encryptedApiKey),
      systemPrompt: config.systemPrompt,
      triggerMode: config.triggerMode,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      businessContext: config.businessContext || {},
      updatedAt: config.updatedAt,
    };
  }

  async saveConfig(tenantId: string, dto: SaveAiConfigDto): Promise<any> {
    let config = await this.configRepo.findOne({ where: { tenantId } });

    if (!config) {
      config = this.configRepo.create({
        tenantId,
        isEnabled: dto.isEnabled ?? false,
        provider: dto.provider || 'gemini',
        model: dto.model || 'gemini-1.5-flash',
        systemPrompt: dto.systemPrompt,
        triggerMode: dto.triggerMode || 'NO_HUMAN_ACTIVE',
        temperature: dto.temperature ?? 0.7,
        maxTokens: dto.maxTokens ?? 500,
        businessContext: dto.businessContext || {},
      });
    } else {
      if (dto.isEnabled !== undefined) config.isEnabled = dto.isEnabled;
      if (dto.provider) config.provider = dto.provider;
      if (dto.model) config.model = dto.model;
      if (dto.systemPrompt !== undefined) config.systemPrompt = dto.systemPrompt;
      if (dto.triggerMode) config.triggerMode = dto.triggerMode;
      if (dto.temperature !== undefined) config.temperature = dto.temperature;
      if (dto.maxTokens !== undefined) config.maxTokens = dto.maxTokens;
      if (dto.businessContext !== undefined) config.businessContext = dto.businessContext;
    }

    // Process API Key update
    if (dto.apiKey && typeof dto.apiKey === 'string') {
      const trimmed = dto.apiKey.trim();
      if (trimmed.length > 0 && !this.cryptoService.isMasked(trimmed)) {
        config.encryptedApiKey = this.cryptoService.encrypt(trimmed);
      }
    }

    const saved = await this.configRepo.save(config);
    return this.getConfig(saved.tenantId);
  }

  async testConnection(tenantId: string, dto: TestAiConnectionDto): Promise<any> {
    const providerType = dto.provider || 'gemini';
    const model = dto.model || (providerType === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');

    let keyToTest: string | null = null;

    if (dto.apiKey && !this.cryptoService.isMasked(dto.apiKey)) {
      keyToTest = dto.apiKey.trim();
    } else {
      // Use stored encrypted key
      const stored = await this.configRepo.findOne({ where: { tenantId } });
      if (stored?.encryptedApiKey) {
        keyToTest = this.cryptoService.decrypt(stored.encryptedApiKey);
      }
    }

    if (!keyToTest) {
      return {
        success: false,
        message: 'No API Key provided or found in saved configuration.',
        latencyMs: 0,
        model,
      };
    }

    if (providerType === 'gemini') {
      return this.geminiProvider.testConnection(keyToTest, model);
    } else {
      return this.openAiProvider.testConnection(keyToTest, model);
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
