import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import {
  IAiProvider,
  GenerateReplyParams,
  GenerateReplyResult,
  TestConnectionResult,
} from './ai-provider.interface';

@Injectable()
export class GeminiAiProvider implements IAiProvider {
  private readonly logger = new Logger(GeminiAiProvider.name);
  readonly providerName = 'gemini' as const;

  async generateReply(params: GenerateReplyParams): Promise<GenerateReplyResult> {
    const {
      apiKey,
      model = 'gemini-1.5-flash',
      systemPrompt,
      history = [],
      latestMessage,
      temperature = 0.7,
      maxTokens = 500,
      businessContext = {},
    } = params;

    if (!apiKey) {
      throw new BadRequestException('Gemini API Key is missing or invalid.');
    }

    const startTime = Date.now();
    const cleanModel = model.trim() || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;

    // 1. Compile System Prompt + Business Context
    let contextualSystemPrompt = systemPrompt;
    if (businessContext && Object.keys(businessContext).length > 0) {
      contextualSystemPrompt += `\n\n[Store Information & Context]:\n${JSON.stringify(businessContext, null, 2)}`;
    }

    // 2. Format history contents into Gemini v1beta format
    // Roles in Gemini API must alternate user -> model
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of history) {
      const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
      if (msg.text && msg.text.trim()) {
        contents.push({
          role,
          parts: [{ text: msg.text.trim() }],
        });
      }
    }

    // Append latest customer message
    contents.push({
      role: 'user',
      parts: [{ text: latestMessage.trim() }],
    });

    const payload = {
      systemInstruction: {
        parts: [{ text: contextualSystemPrompt }],
      },
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    try {
      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000,
      });

      const latencyMs = Date.now() - startTime;
      const data = response.data;

      const candidate = data.candidates?.[0];
      const reply =
        candidate?.content?.parts?.[0]?.text?.trim() ||
        'Thank you for reaching out! Our team will get back to you shortly.';

      const tokensUsed =
        data.usageMetadata?.totalTokenCount ||
        data.usageMetadata?.candidatesTokenCount ||
        Math.ceil((contextualSystemPrompt.length + latestMessage.length + reply.length) / 4);

      return {
        reply,
        tokensUsed,
        latencyMs,
        model: cleanModel,
        provider: 'gemini',
        rawResponse: data,
      };
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      const errorMsg =
        error.response?.data?.error?.message ||
        error.message ||
        'Unknown error during Gemini API call';

      this.logger.error(`Gemini generateReply failed (${latencyMs}ms): ${errorMsg}`);
      throw new Error(`Gemini API Error: ${errorMsg}`);
    }
  }

  async testConnection(apiKey: string, model = 'gemini-1.5-flash'): Promise<TestConnectionResult> {
    if (!apiKey || !apiKey.trim()) {
      return {
        success: false,
        message: 'Please provide a valid Gemini API key.',
        latencyMs: 0,
        model,
      };
    }

    const cleanModel = model.trim() || 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey.trim()}`;
    const startTime = Date.now();

    try {
      const response = await axios.post(
        endpoint,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Respond strictly with "OK" if this connection test is successful.' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0.1,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        },
      );

      const latencyMs = Date.now() - startTime;
      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        success: true,
        message: `Gemini connected successfully (${cleanModel}) in ${latencyMs}ms. Response: "${reply.trim()}"`,
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
        message: `Gemini verification failed (${latencyMs}ms): ${errorMsg}`,
        latencyMs,
        model: cleanModel,
      };
    }
  }
}
