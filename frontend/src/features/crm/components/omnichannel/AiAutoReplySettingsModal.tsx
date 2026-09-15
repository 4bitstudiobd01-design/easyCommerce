'use client';

import React, { useState, useEffect } from 'react';
import {
  useGetAiConfigQuery,
  useSaveAiConfigMutation,
  useTestAiConnectionMutation,
  useGetAiLogsQuery,
} from '../../api/omnichannelApi';
import {
  AiProviderType,
  AiTriggerMode,
  OmnichannelAiLog,
} from '../../types/omnichannel.types';
import {
  Sparkles,
  Bot,
  Key,
  Sliders,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TEMPLATES = [
  {
    name: 'Standard Support',
    prompt:
      'You are a friendly and professional customer support assistant for our online store. Answer customer queries regarding product details, order statuses, delivery timelines, payment options, and return policies accurately. Keep answers concise, clear, and polite. If you cannot answer a query, politely ask the customer to wait for a human agent.',
  },
  {
    name: 'Sales & Conversion',
    prompt:
      'You are an enthusiastic and helpful eCommerce sales specialist for our store. Assist customers in discovering the best products, recommend matching items, explain current deals, and guide them through placing orders smoothly. Always maintain an upbeat and polite tone.',
  },
  {
    name: 'Concise & Fast FAQ',
    prompt:
      'You are an automated support bot. Provide direct, factual, and concise answers to customer questions. Use bullet points when explaining policies or shipping steps. Never make up facts not provided in your instructions.',
  },
];

export const AiAutoReplySettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'provider' | 'persona' | 'rules' | 'logs'>('provider');

  // Redux API Queries & Mutations
  const { data: config, isLoading: isLoadingConfig, refetch: refetchConfig } = useGetAiConfigQuery(undefined, {
    skip: !isOpen,
  });
  const [saveConfigMutation, { isLoading: isSaving }] = useSaveAiConfigMutation();
  const [testConnectionMutation, { isLoading: isTesting }] = useTestAiConnectionMutation();
  const { data: logs = [], isLoading: isLoadingLogs, refetch: refetchLogs } = useGetAiLogsQuery(
    { limit: 30 },
    { skip: !isOpen || activeTab !== 'logs', pollingInterval: activeTab === 'logs' ? 8000 : 0 },
  );

  // Form State
  const [isEnabled, setIsEnabled] = useState(false);
  const [provider, setProvider] = useState<AiProviderType>('gemini');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [triggerMode, setTriggerMode] = useState<AiTriggerMode>('NO_HUMAN_ACTIVE');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(500);

  // Test Connection feedback
  const [testFeedback, setTestFeedback] = useState<{
    success?: boolean;
    message?: string;
    latencyMs?: number;
  } | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Populate state on config fetch
  useEffect(() => {
    if (config) {
      setIsEnabled(config.isEnabled ?? false);
      setProvider(config.provider || 'gemini');
      setModel(config.model || (config.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash'));
      setApiKey(config.apiKeyMasked || '');
      setSystemPrompt(config.systemPrompt || PRESET_TEMPLATES[0].prompt);
      setTriggerMode(config.triggerMode || 'NO_HUMAN_ACTIVE');
      setTemperature(config.temperature ?? 0.7);
      setMaxTokens(config.maxTokens ?? 500);
    }
  }, [config]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      await saveConfigMutation({
        isEnabled,
        provider,
        model,
        apiKey: apiKey.trim(),
        systemPrompt,
        triggerMode,
        temperature,
        maxTokens,
      }).unwrap();

      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
      refetchConfig();
    } catch (err: any) {
      alert(`Failed to save AI configuration: ${err?.data?.message || err.message}`);
    }
  };

  const handleTestConnection = async () => {
    setTestFeedback(null);
    try {
      const res = await testConnectionMutation({
        provider,
        model,
        apiKey: apiKey.trim(),
      }).unwrap();
      setTestFeedback(res);
    } catch (err: any) {
      setTestFeedback({
        success: false,
        message: err?.data?.message || err.message || 'Connection test failed',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Modal Header ─────────────────────────────────────────────── */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">AI Auto-Reply Automation</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Gemini & GPT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated context-aware customer support across WhatsApp, Telegram, & Messenger.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Navigation Tabs ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-6 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('provider')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'provider'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>1. AI Provider & Model</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'persona'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Persona & Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'rules'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. Automation Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
              activeTab === 'logs'
                ? 'border-teal-600 text-teal-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>4. Activity Logs</span>
          </button>
        </div>

        {/* ── Tab Content Area ────────────────────────────────────────── */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {isLoadingConfig ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              <p className="font-bold">Loading AI settings...</p>
            </div>
          ) : (
            <>
              {/* ── TAB 1: AI Provider & Model ──────────────────────────── */}
              {activeTab === 'provider' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Provider Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Select AI Provider
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Google Gemini Card */}
                      <div
                        onClick={() => {
                          setProvider('gemini');
                          setModel('gemini-1.5-flash');
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          provider === 'gemini'
                            ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 text-white flex items-center justify-center font-bold text-xs">
                              G
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">Google Gemini</h4>
                              <p className="text-[11px] text-slate-500">Fast, cost-effective, high context</p>
                            </div>
                          </div>
                          {provider === 'gemini' && (
                            <CheckCircle2 className="w-5 h-5 text-teal-600" />
                          )}
                        </div>
                      </div>

                      {/* OpenAI Card */}
                      <div
                        onClick={() => {
                          setProvider('openai');
                          setModel('gpt-4o-mini');
                        }}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          provider === 'openai'
                            ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                              AI
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">OpenAI / GPT</h4>
                              <p className="text-[11px] text-slate-500">GPT-4o & GPT-4o-mini support</p>
                            </div>
                          </div>
                          {provider === 'openai' && (
                            <CheckCircle2 className="w-5 h-5 text-teal-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Model Identifier</label>
                      {provider === 'gemini' ? (
                        <select
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                        >
                          <option value="gemini-1.5-flash">gemini-1.5-flash (Recommended & Ultra-fast)</option>
                          <option value="gemini-1.5-pro">gemini-1.5-pro (Advanced Reasoning)</option>
                          <option value="gemini-2.0-flash">gemini-2.0-flash (Latest experimental)</option>
                        </select>
                      ) : (
                        <select
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                        >
                          <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost-Effective)</option>
                          <option value="gpt-4o">gpt-4o (High Intelligence Flagship)</option>
                          <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        </select>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          {provider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
                        </label>
                        {provider === 'gemini' && (
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                          >
                            <span>Get Free Key</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={
                            config?.hasApiKey
                              ? '•••••••••••• (Leave unchanged to keep)'
                              : provider === 'gemini'
                              ? 'AIzaSy...'
                              : 'sk-...'
                          }
                          className="w-full py-2.5 pl-3.5 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security Note & Test Button */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>API keys are stored with AES-256-GCM authenticated encryption per tenant.</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-xs"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-teal-400" />
                      )}
                      <span>Test Live Connection</span>
                    </button>
                  </div>

                  {/* Test Connection Results Card */}
                  {testFeedback && (
                    <div
                      className={`p-3.5 rounded-2xl text-xs border flex items-start gap-2.5 animate-in fade-in duration-150 ${
                        testFeedback.success
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-rose-50 text-rose-900 border-rose-200'
                      }`}
                    >
                      {testFeedback.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <p className="font-bold">{testFeedback.message}</p>
                        {testFeedback.latencyMs !== undefined && (
                          <p className="text-[11px] opacity-80">
                            Latency: <span className="font-mono font-bold">{testFeedback.latencyMs}ms</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB 2: Persona & Instructions ───────────────────────── */}
              {activeTab === 'persona' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Business Persona & Guidelines
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Templates:
                    </span>
                  </div>

                  {/* Preset Template Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSystemPrompt(tmpl.prompt)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>{tmpl.name}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>

                  {/* System Prompt Editor */}
                  <div className="space-y-1.5">
                    <textarea
                      rows={7}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Instruct the AI on store details, response tone, return policy, and when to ask for human agent..."
                      className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs text-slate-800 leading-relaxed font-sans focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                    <p className="text-[11px] text-slate-500">
                      💡 Tip: Include your store delivery schedule, return window, and polite greetings in Bengali / English as preferred.
                    </p>
                  </div>

                  {/* Fine Tuning Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Creativity (Temperature)</span>
                        <span className="font-mono font-bold text-teal-700">{temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-teal-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Precise (0.0)</span>
                        <span>Balanced (0.7)</span>
                        <span>Creative (1.0)</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Max Reply Length</span>
                        <span className="font-mono font-bold text-teal-700">{maxTokens} tokens</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="1500"
                        step="50"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                        className="w-full accent-teal-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Short (100)</span>
                        <span>Standard (500)</span>
                        <span>Detailed (1500)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 3: Automation Rules ─────────────────────────────── */}
              {activeTab === 'rules' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Master Toggle */}
                  <div className="p-4.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-teal-950">Enable AI Auto-Reply</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            isEnabled
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {isEnabled ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-xs text-teal-800">
                        Automatically generate context-aware replies for inbound customer queries.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEnabled(!isEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-teal-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Trigger Mode Rules */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      When should AI reply?
                    </label>

                    <div className="space-y-2">
                      <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex items-start gap-3 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="triggerMode"
                          value="NO_HUMAN_ACTIVE"
                          checked={triggerMode === 'NO_HUMAN_ACTIVE'}
                          onChange={() => setTriggerMode('NO_HUMAN_ACTIVE')}
                          className="mt-0.5 accent-teal-600"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            When no human agent is active (Recommended)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            AI responds to incoming messages. If a human agent replies to the thread, AI pauses automatically for that conversation.
                          </p>
                        </div>
                      </label>

                      <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex items-start gap-3 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="triggerMode"
                          value="ALWAYS"
                          checked={triggerMode === 'ALWAYS'}
                          onChange={() => setTriggerMode('ALWAYS')}
                          className="mt-0.5 accent-teal-600"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Always Auto-Reply</p>
                          <p className="text-[11px] text-slate-500">
                            AI replies to all inbound messages unless an agent explicitly toggles &quot;Pause AI&quot; on a specific conversation.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Human Takeover Explanation Card */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Human Takeover Safety:</span> Whenever a merchant agent types and sends a reply from the dashboard, the AI is immediately paused for that conversation to prevent overlapping replies. The agent can resume AI anytime with one click.
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 4: Activity Logs ───────────────────────────────── */}
              {activeTab === 'logs' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Recent AI Activity & Error Logs
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                        {logs.length} entries
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => refetchLogs()}
                      className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {isLoadingLogs ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                      <p>Loading AI logs...</p>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-1">
                      <Activity className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-700">No AI Activity Recorded Yet</p>
                      <p className="text-[11px]">Inbound customer messages and AI generated responses will appear here.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      {logs.map((log: OmnichannelAiLog) => (
                        <div key={log.id} className="p-3.5 bg-white hover:bg-slate-50/70 transition-colors text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                                {log.platform}
                              </span>
                              <span className="font-semibold text-slate-500 text-[11px]">
                                {log.model}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {log.status === 'SUCCESS' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  {log.latencyMs}ms • {log.tokensUsed} tokens
                                </span>
                              )}
                              {log.status.startsWith('SKIPPED') && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                  {log.status}
                                </span>
                              )}
                              {log.status === 'FAILED' && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  FAILED
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-slate-800">
                              <span className="font-bold text-slate-500">Query: </span>
                              {log.userQuery}
                            </p>
                            {log.aiResponse && (
                              <p className="text-teal-900 bg-teal-50/60 p-2 rounded-xl border border-teal-100 text-[11px] leading-relaxed">
                                <span className="font-bold text-teal-700">AI Response: </span>
                                {log.aiResponse}
                              </p>
                            )}
                            {log.errorMessage && (
                              <p className="text-rose-700 text-[11px] font-medium">
                                <span className="font-bold">Error: </span>
                                {log.errorMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Modal Footer ─────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs">
            {saveSuccessMsg && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings saved and encrypted!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-teal-600/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Save AI Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
