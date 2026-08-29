import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import {
  IAiProvider,
  GenerateReplyParams,
  GenerateReplyResult,
  TestConnectionResult,
} from './ai-provider.interface';

const GEMINI_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-2.5-pro',
  'gemini-pro-latest',
];

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
      maxTokens = 1000,
      businessContext = {},
    } = params;

    if (!apiKey) {
      throw new BadRequestException('Gemini API Key is missing or invalid.');
    }

    const startTime = Date.now();

    // 1. Compile System Prompt + Business Context
    let contextualSystemPrompt = systemPrompt;
    if (businessContext && Object.keys(businessContext).length > 0) {
      contextualSystemPrompt += `\n\n[Store Information & Context]:\n${JSON.stringify(businessContext, null, 2)}`;
    }

    // 2. Format history contents into Gemini v1beta format
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    for (const msg of history) {
      const role = msg.role === 'model' || msg.role === 'assistant' ? 'model' : 'user';
      if (msg.text && msg.text.trim()) {
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${msg.text.trim()}`;
        } else {
          contents.push({
            role,
            parts: [{ text: msg.text.trim() }],
          });
        }
      }
    }

    // Append latest customer message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n${latestMessage.trim()}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: latestMessage.trim() }],
      });
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: contextualSystemPrompt }],
      },
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: Math.max(maxTokens || 500, 1000),
      },
    };

    // Try primary model first, fallback to alternatives if 404 / model not found
    const modelsToTry = [
      model.trim() || 'gemini-1.5-flash',
      ...GEMINI_FALLBACK_MODELS.filter((m) => m !== model.trim()),
    ];

    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey.trim()}`;

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
          model: currentModel,
          provider: 'gemini',
          rawResponse: data,
        };
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const msg = error.response?.data?.error?.message || error.message || '';
        // If 404 not found, 503 high demand, 429 rate limit/quota, or not supported, try next model in fallback list
        if (
          status === 404 ||
          status === 503 ||
          status === 429 ||
          msg.includes('not found') ||
          msg.includes('not supported') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('exceeded your current quota') ||
          msg.includes('RESOURCE_EXHAUSTED')
        ) {
          this.logger.warn(`Gemini model ${currentModel} returned ${status || msg}. Retrying next fallback model...`);
          continue;
        }
        // For other errors (403 auth, 400 bad request), break immediately
        break;
      }
    }

    const latencyMs = Date.now() - startTime;
    const errorMsg =
      lastError?.response?.data?.error?.message ||
      lastError?.message ||
      'Unknown error during Gemini API call';

    this.logger.error(`Gemini generateReply failed (${latencyMs}ms): ${errorMsg}`);
    throw new Error(`Gemini API Error: ${errorMsg}`);
  }

  async testConnection(apiKey: string, model = 'gemini-flash-latest'): Promise<TestConnectionResult> {
    if (!apiKey || !apiKey.trim()) {
      return {
        success: false,
        message: 'Please provide a valid Gemini API key.',
        latencyMs: 0,
        model,
      };
    }

    const modelsToTry = [
      model.trim() || 'gemini-flash-latest',
      ...GEMINI_FALLBACK_MODELS.filter((m) => m !== model.trim()),
    ];

    const startTime = Date.now();
    let lastError: any = null;

    for (const currentModel of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey.trim()}`;

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
          message: `Gemini connected successfully (${currentModel}) in ${latencyMs}ms. Response: "${reply.trim()}"`,
          latencyMs,
          model: currentModel,
        };
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        const msg = error.response?.data?.error?.message || error.message || '';
        if (status === 404 || status === 503 || msg.includes('not found') || msg.includes('not supported') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
          continue;
        }
        break;
      }
    }

    const latencyMs = Date.now() - startTime;
    const errorMsg =
      lastError?.response?.data?.error?.message ||
      lastError?.message ||
      'Connection test failed';

    return {
      success: false,
      message: `Gemini verification failed (${latencyMs}ms): ${errorMsg}`,
      latencyMs,
      model,
    };
  }
}
