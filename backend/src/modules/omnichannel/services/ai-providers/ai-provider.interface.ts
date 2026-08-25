export interface AiChatMessage {
  role: 'user' | 'model' | 'assistant';
  text: string;
}

export interface GenerateReplyParams {
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: AiChatMessage[];
  latestMessage: string;
  temperature?: number;
  maxTokens?: number;
  businessContext?: Record<string, any>;
}

export interface GenerateReplyResult {
  reply: string;
  tokensUsed: number;
  latencyMs: number;
  model: string;
  provider: string;
  rawResponse?: any;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latencyMs: number;
  model: string;
}

export interface IAiProvider {
  readonly providerName: 'gemini' | 'openai';
  generateReply(params: GenerateReplyParams): Promise<GenerateReplyResult>;
  testConnection(apiKey: string, model: string): Promise<TestConnectionResult>;
}
