import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import {
  IAiProvider,
  GenerateReplyParams,
  GenerateReplyResult,
  TestConnectionResult,
} from './ai-provider.interface';

@Injectable()
export class OpenAiProvider implements IAiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  readonly providerName = 'openai' as const;

  private getEndpoint(providerType: string = 'openai'): string {
    if (providerType === 'deepseek') {
      return 'https://api.deepseek.com/chat/completions';
    }
    if (providerType === 'groq') {
      return 'https://api.groq.com/openai/v1/chat/completions';
    }
    return 'https://api.openai.com/v1/chat/completions';
  }

  async generateReply(
    params: GenerateReplyParams & { providerType?: 'openai' | 'deepseek' | 'groq' },
  ): Promise<GenerateReplyResult> {
    const {
      apiKey,
      model = 'gpt-4o-mini',
      systemPrompt,
      history = [],
      latestMessage,
      temperature = 0.7,
      maxTokens = 500,
      businessContext = {},
      providerType = 'openai',
    } = params;

    if (!apiKey) {
      throw new BadRequestException(`${providerType.toUpperCase()} API Key is missing or invalid.`);
    }

    const startTime = Date.now();
    const cleanModel = model.trim() || 'gpt-4o-mini';
    const endpoint = this.getEndpoint(providerType);

    // 1. Compile System Prompt + Business Context
    let contextualSystemPrompt = systemPrompt;
    if (businessContext && Object.keys(businessContext).length > 0) {
      contextualSystemPrompt += `\n\n[Store Information & Context]:\n${JSON.stringify(businessContext, null, 2)}`;
    }

    // 2. Format history into OpenAI messages format
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: contextualSystemPrompt },
    ];

    for (const msg of history) {
      const role = msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user';
      if (msg.text && msg.text.trim()) {
        messages.push({ role, content: msg.text.trim() });
      }
    }

    // Append latest customer query
    messages.push({ role: 'user', content: latestMessage.trim() });

    const payload = {
      model: cleanModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        timeout: 25000,
      });

      const latencyMs = Date.now() - startTime;
      const data = response.data;
      const reply =
        data.choices?.[0]?.message?.content?.trim() ||
        'Thank you for contacting us. We will assist you shortly.';

      const tokensUsed = data.usage?.total_tokens || 0;

      return {
        reply,
        tokensUsed,
        latencyMs,
        model: cleanModel,
        provider: providerType,
        rawResponse: data,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg =
        error.response?.data?.error?.message ||
        error.message ||
        `Unknown error during ${providerType} API call`;

      this.logger.error(`${providerType} generateReply failed (${latencyMs}ms): ${errorMsg}`);
      throw new Error(`${providerType.toUpperCase()} API Error: ${errorMsg}`);
    }
  }

  async testConnection(
    apiKey: string,
    model = 'gpt-4o-mini',
    providerType: 'openai' | 'deepseek' | 'groq' = 'openai',
  ): Promise<TestConnectionResult> {
    if (!apiKey || !apiKey.trim()) {
      return {
        success: false,
        message: `Please provide a valid ${providerType.toUpperCase()} API key.`,
        latencyMs: 0,
        model,
      };
    }

    const cleanModel = model.trim() || 'gpt-4o-mini';
    const endpoint = this.getEndpoint(providerType);
    const startTime = Date.now();

    try {
      const response = await axios.post(
        endpoint,
        {
          model: cleanModel,
          messages: [
            {
              role: 'user',
              content: 'Respond strictly with "OK" if connection is valid.',
            },
          ],
          max_tokens: 10,
          temperature: 0.1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          timeout: 15000,
        },
      );

      const latencyMs = Date.now() - startTime;
      const reply = response.data?.choices?.[0]?.message?.content || '';

      return {
        success: true,
        message: `${providerType.toUpperCase()} connected successfully (${cleanModel}) in ${latencyMs}ms. Response: "${reply.trim()}"`,
        latencyMs,
        model: cleanModel,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg =
        error.response?.data?.error?.message ||
        error.message ||
        'Connection test failed';

      return {
        success: false,
        message: `${providerType.toUpperCase()} verification failed (${latencyMs}ms): ${errorMsg}`,
        latencyMs,
        model: cleanModel,
      };
    }
  }
}
