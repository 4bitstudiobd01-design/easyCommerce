import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithReauth } from '@/store/baseQueryWithReauth';
import {
  ChannelCredential,
  ConversationThread,
  ThreadMessage,
  SocialPlatform,
  OmnichannelAiConfig,
  SaveAiConfigRequest,
  TestAiConnectionRequest,
  TestAiConnectionResponse,
  OmnichannelAiLog,
  ConversationAiState,
} from '../types/omnichannel.types';

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
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
        const isSuccess = response?.success !== false;
        const msg =
          response?.message ||
          (response?.data?.username
            ? `Connected successfully as @${response.data.username}`
            : 'Connection validated successfully!');
        return {
          success: isSuccess,
          message: msg,
          data: response?.data ?? response,
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
    getAiConfig: builder.query<OmnichannelAiConfig, void>({
      query: () => '/ai/config',
      providesTags: ['OmnichannelAiConfig'],
      transformResponse: (response: any) => extractData(response),
    }),

    saveAiConfig: builder.mutation<OmnichannelAiConfig, SaveAiConfigRequest>({
      query: (body) => ({
        url: '/ai/config',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OmnichannelAiConfig', 'OmnichannelAiLog'],
      transformResponse: (response: any) => extractData(response),
    }),

    testAiConnection: builder.mutation<TestAiConnectionResponse, TestAiConnectionRequest>({
      query: (body) => ({
        url: '/ai/test',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return {
          success: response?.success !== false,
          message: response?.message || response?.data?.reply || 'AI connection test successful.',
          sampleReply: response?.data?.reply || response?.reply,
          provider: response?.data?.provider || response?.provider,
          model: response?.data?.model || response?.model,
          latencyMs: response?.data?.latencyMs || response?.latencyMs || 0,
        };
      },
    }),

    getAiLogs: builder.query<OmnichannelAiLog[], { limit?: number } | void>({
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

    getConversationAiState: builder.query<ConversationAiState, string>({
      query: (conversationId) => `/ai/conversations/${conversationId}/state`,
      providesTags: (result, error, conversationId) => [
        { type: 'OmnichannelConversation', id: conversationId },
      ],
      transformResponse: (response: any) => extractData(response),
    }),

    toggleConversationAi: builder.mutation<
      ConversationAiState,
      { conversationId: string; isPaused: boolean }
    >({
      query: ({ conversationId, isPaused }) => ({
        url: `/ai/conversations/${conversationId}/toggle`,
        method: 'POST',
        body: { isPaused },
      }),
      invalidatesTags: ['OmnichannelConversation'],
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
  useGetTelegramBotInfoQuery,
  useGetAiConfigQuery,
  useSaveAiConfigMutation,
  useTestAiConnectionMutation,
  useGetAiLogsQuery,
  useGetConversationAiStateQuery,
  useToggleConversationAiMutation,
} = omnichannelApi;
