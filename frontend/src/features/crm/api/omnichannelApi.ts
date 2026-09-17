import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import {
  ChannelCredential,
  ConversationThread,
  ThreadMessage,
  SocialPlatform,
} from '../types/omnichannel.types';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1')
  .replace(/\/+$/, '');

function extractData<T = any>(response: any): T {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }
  if (response?.data !== undefined) {
    return response.data;
  }
  return response;
}

export const omnichannelApi = createApi({
  reducerPath: 'omnichannelApi',
  baseQuery: createBaseQueryWithReauth(`${API_ROOT}/omnichannel`),
  tagTypes: [
    'OmnichannelCredential',
    'OmnichannelConversation',
    'OmnichannelMessage',
    'OmnichannelAiConfig',
    'OmnichannelAiLog',
    'OmnichannelAiDocument',
  ],
  endpoints: (builder) => ({
    // ─── Credentials Endpoints ─────────────────────────────────────────────
    getChannelCredentials: builder.query<ChannelCredential[], { unmask?: boolean } | void>({
      query: (params) => ({
        url: '/credentials',
        params: params?.unmask ? { unmask: 'true' } : {},
      }),
      providesTags: ['OmnichannelCredential'],
      transformResponse: (response: any) => {
        const payload = extractData(response);
        return Array.isArray(payload) ? payload : [];
      },
    }),

    getPlatformCredential: builder.query<ChannelCredential, { platform: SocialPlatform; unmask?: boolean }>({
      query: ({ platform, unmask }) => ({
        url: `/credentials/${platform}`,
        params: unmask ? { unmask: 'true' } : {},
      }),
      providesTags: (result, error, { platform }) => [{ type: 'OmnichannelCredential', id: platform }],
      transformResponse: (response: any) => extractData(response),
    }),

    saveChannelCredentials: builder.mutation<
      ChannelCredential,
      { platform: SocialPlatform; name?: string; credentials: Record<string, any>; accountHandle?: string; metadata?: Record<string, any> }
    >({
      query: (body) => ({
        url: '/credentials',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OmnichannelCredential'],
      transformResponse: (response: any) => extractData(response),
    }),

    testChannelConnection: builder.mutation<
      { success: boolean; message: string; data?: any },
      { platform: SocialPlatform; credentials?: Record<string, any> }
    >({
      query: ({ platform, credentials }) => ({
        url: `/credentials/${platform}/test`,
        method: 'POST',
        body: credentials ? { credentials } : {},
      }),
      invalidatesTags: ['OmnichannelCredential'],
      transformResponse: (response: any) => {
        if (response?.data && typeof response.data === 'object' && response.data.success !== undefined) {
          return response.data;
        }
        if (response && response.success !== undefined) {
          return {
            success: Boolean(response.success),
            message: response.message || 'Connection verified successfully!',
            data: response.data,
          };
        }
        return {
          success: true,
          message: response?.message || 'Connection verified successfully!',
          data: extractData(response),
        };
      },
    }),

    toggleChannelActive: builder.mutation<
      ChannelCredential,
      { platform: SocialPlatform; isActive: boolean }
    >({
      query: ({ platform, isActive }) => ({
        url: `/credentials/${platform}/toggle`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['OmnichannelCredential'],
      transformResponse: (response: any) => extractData(response),
    }),

    deleteChannelCredentials: builder.mutation<{ success: boolean; message: string }, SocialPlatform>({
      query: (platform) => ({
        url: `/credentials/${platform}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OmnichannelCredential'],
      transformResponse: (response: any) => extractData(response),
    }),

    // ─── Chat & Conversation Endpoints ─────────────────────────────────────
    getConversations: builder.query<ConversationThread[], { platform?: string; search?: string } | void>({
      query: (params) => ({
        url: '/chat/conversations',
        params: params || {},
      }),
      providesTags: ['OmnichannelConversation'],
      transformResponse: (response: any) => {
        const payload = extractData(response);
        return Array.isArray(payload) ? payload : [];
      },
    }),

    getConversationMessages: builder.query<ThreadMessage[], string>({
      query: (conversationId) => `/chat/conversations/${conversationId}/messages`,
      providesTags: (result, error, conversationId) => [
        { type: 'OmnichannelMessage', id: conversationId },
      ],
      transformResponse: (response: any) => {
        const payload = extractData(response);
        return Array.isArray(payload) ? payload : [];
      },
    }),

    sendChannelMessage: builder.mutation<
      { success: boolean; message: string; result?: any },
      { platform: SocialPlatform; recipientId: string; text: string; conversationId?: string }
    >({
      query: (body) => ({
        url: '/chat/send',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OmnichannelConversation', 'OmnichannelMessage'],
      transformResponse: (response: any) => extractData(response),
    }),

    sendDirectTelegramMessage: builder.mutation<
      { success: boolean; message: string; result?: any },
      { chatId: string | number; text: string }
    >({
      query: (body) => ({
        url: '/chat/telegram/send-direct',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OmnichannelConversation', 'OmnichannelMessage'],
      transformResponse: (response: any) => extractData(response),
    }),

    getTelegramBotInfo: builder.query<any, void>({
      query: () => '/chat/telegram/info',
      transformResponse: (response: any) => extractData(response),
    }),

    // ─── AI Auto-Reply Endpoints ───────────────────────────────────────────
    getAiConfig: builder.query<any, void>({
      query: () => '/ai/config',
      providesTags: ['OmnichannelAiConfig'],
      transformResponse: (response: any) => extractData(response),
    }),

    saveAiConfig: builder.mutation<any, any>({
      query: (body) => ({
        url: '/ai/config',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OmnichannelAiConfig'],
      transformResponse: (response: any) => extractData(response),
    }),

    testAiConnection: builder.mutation<any, { provider?: string; model?: string; apiKey?: string }>({
      query: (body) => ({
        url: '/ai/test',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => extractData(response),
    }),

    toggleConversationAi: builder.mutation<any, { conversationId: string; isPaused: boolean }>({
      query: ({ conversationId, isPaused }) => ({
        url: `/ai/conversations/${conversationId}/toggle`,
        method: 'POST',
        body: { isPaused },
      }),
      invalidatesTags: ['OmnichannelConversation'],
      transformResponse: (response: any) => extractData(response),
    }),

    generateAiDraft: builder.mutation<
      {
        success: boolean;
        reply: string;
        model: string;
        provider: string;
        latencyMs: number;
        tokensUsed: number;
      },
      { conversationId: string; promptOverride?: string; provider?: string; model?: string }
    >({
      query: ({ conversationId, promptOverride, provider, model }) => ({
        url: `/ai/conversations/${conversationId}/suggest`,
        method: 'POST',
        body: { promptOverride, provider, model },
      }),
      transformResponse: (response: any) => extractData(response),
    }),

    getAiLogs: builder.query<any[], { limit?: number } | void>({
      query: (params) => ({
        url: '/ai/logs',
        params: params || {},
      }),
      providesTags: ['OmnichannelAiLog'],
      transformResponse: (response: any) => {
        const payload = extractData(response);
        return Array.isArray(payload) ? payload : [];
      },
    }),

    // ─── Multi-Tenant RAG Knowledge Base Documents ────────────────────────────
    getAiDocuments: builder.query<any[], void>({
      query: () => ({
        url: '/ai/documents',
      }),
      providesTags: ['OmnichannelAiDocument'],
      transformResponse: (response: any) => {
        const payload = extractData(response);
        return Array.isArray(payload) ? payload : [];
      },
    }),

    uploadAiDocument: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/ai/documents/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['OmnichannelAiDocument'],
      transformResponse: (response: any) => extractData(response),
    }),

    deleteAiDocument: builder.mutation<{ success: boolean; message: string }, string>({
      query: (documentId) => ({
        url: `/ai/documents/${documentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OmnichannelAiDocument'],
      transformResponse: (response: any) => extractData(response),
    }),

    syncChannelConversations: builder.mutation<
      { success: boolean; message: string; count?: number },
      string
    >({
      query: (platform) => ({
        url: `/chat/sync/${platform}`,
        method: 'POST',
      }),
      invalidatesTags: ['OmnichannelConversation', 'OmnichannelMessage'],
      transformResponse: (response: any) => extractData(response),
    }),
  }),
});

export const {
  useGetChannelCredentialsQuery,
  useGetPlatformCredentialQuery,
  useSaveChannelCredentialsMutation,
  useTestChannelConnectionMutation,
  useToggleChannelActiveMutation,
  useDeleteChannelCredentialsMutation,
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useSendChannelMessageMutation,
  useSendDirectTelegramMessageMutation,
  useGetTelegramBotInfoQuery,
  useGetAiConfigQuery,
  useSaveAiConfigMutation,
  useTestAiConnectionMutation,
  useToggleConversationAiMutation,
  useGenerateAiDraftMutation,
  useGetAiLogsQuery,
  useGetAiDocumentsQuery,
  useUploadAiDocumentMutation,
  useDeleteAiDocumentMutation,
  useSyncChannelConversationsMutation,
} = omnichannelApi;
