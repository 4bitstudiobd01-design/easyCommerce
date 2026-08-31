import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import {
  IAiProvider,
  GenerateReplyParams,
  GenerateReplyResult,
  TestConnectionResult,
} from './ai-provider.interface';

@Injectable()
export class ClaudeAiProvider implements IAiProvider {
  private readonly logger = new Logger(ClaudeAiProvider.name);
  readonly providerName = 'claude' as const;

  async generateReply(params: GenerateReplyParams): Promise<GenerateReplyResult> {
    const {
      apiKey,
      model = 'claude-3-5-sonnet-20241022',
      systemPrompt,
      history = [],
      latestMessage,
      temperature = 0.7,
      maxTokens = 500,
      businessContext = {},
    } = params;

    if (!apiKey) {
      throw new BadRequestException('Anthropic Claude API Key is missing or invalid.');
    }

    const startTime = Date.now();
    const cleanModel = model.trim() || 'claude-3-5-sonnet-20241022';
    const endpoint = 'https://api.anthropic.com/v1/messages';

    // 1. Compile System Prompt + Business Context
    let contextualSystemPrompt = systemPrompt;
    if (businessContext && Object.keys(businessContext).length > 0) {
      contextualSystemPrompt += `\n\n[Store Information & Context]:\n${JSON.stringify(businessContext, null, 2)}`;
    }

    // 2. Format history into Claude messages
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    for (const msg of history) {
      const role = msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user';
      if (msg.text && msg.text.trim()) {
        messages.push({ role, content: msg.text.trim() });
      }
    }

    // Append latest user message
    messages.push({ role: 'user', content: latestMessage.trim() });

    const payload = {
      model: cleanModel,
      system: contextualSystemPrompt,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
        },
        timeout: 25000,
      });

      const latencyMs = Date.now() - startTime;
      const data = response.data;
      const reply =
        data.content?.[0]?.text?.trim() ||
        'Thank you for reaching out. We will assist you shortly.';

      const tokensUsed =
        (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

      return {
        reply,
        tokensUsed,
        latencyMs,
        model: cleanModel,
        provider: 'claude',
        rawResponse: data,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg =
        error.response?.data?.error?.message ||
        error.message ||
        'Unknown error during Anthropic API call';

      this.logger.error(`Claude generateReply failed (${latencyMs}ms): ${errorMsg}`);
      throw new Error(`Claude API Error: ${errorMsg}`);
    }
  }

  async testConnection(
    apiKey: string,
    model = 'claude-3-5-sonnet-20241022',
  ): Promise<TestConnectionResult> {
    if (!apiKey || !apiKey.trim()) {
      return {
        success: false,
        message: 'Please provide a valid Anthropic Claude API key.',
        latencyMs: 0,
        model,
      };
    }

    const cleanModel = model.trim() || 'claude-3-5-sonnet-20241022';
    const endpoint = 'https://api.anthropic.com/v1/messages';
    const startTime = Date.now();

    try {
      const response = await axios.post(
        endpoint,
        {
          model: cleanModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Respond with "OK" if connection works.' }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey.trim(),
            'anthropic-version': '2023-06-01',
          },
          timeout: 15000,
        },
      );

      const latencyMs = Date.now() - startTime;
      const reply = response.data?.content?.[0]?.text || '';

      return {
        success: true,
        message: `Claude connected successfully (${cleanModel}) in ${latencyMs}ms. Response: "${reply.trim()}"`,
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
        message: `Claude verification failed (${latencyMs}ms): ${errorMsg}`,
        latencyMs,
        model: cleanModel,
      };
    }
  }
}
