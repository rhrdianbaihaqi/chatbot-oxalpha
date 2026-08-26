import { writable, get } from 'svelte/store';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  error?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  badge?: string;
}

export const POPULAR_MODELS: ModelOption[] = [
  {
    id: 'z-ai/glm-5.2:free',
    name: 'GLM 5.2 (Free)',
    provider: 'Zhipu AI',
    description: 'High-capability general reasoning & bilingual intelligence',
    badge: 'Free',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast, intelligent, highly cost-effective flagship model',
    badge: 'Popular',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'State-of-the-art reasoning, code, and writing abilities',
    badge: 'Pro',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Ultra-fast and responsive compact model',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Open powerhouse model for multi-turn conversations',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Next-gen reasoning and code intelligence',
    badge: 'Trending',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Next-gen speed, multimodal intelligence, and reasoning',
  },
];

// Core stores as specified in PRD Section 6.1
export const chatHistory = writable<ChatMessage[]>([]);
export const isTyping = writable<boolean>(false);
export const selectedModel = writable<string>('z-ai/glm-5.2:free');
export const serverStatus = writable<'checking' | 'online' | 'offline'>('checking');
export const errorMessage = writable<string | null>(null);

// Actions & Helpers
export function addMessage(role: 'user' | 'assistant' | 'system', content: string, model?: string): ChatMessage {
  const newMsg: ChatMessage = {
    id: 'msg-' + Math.random().toString(36).substring(2, 9),
    role,
    content,
    timestamp: Date.now(),
    model,
  };
  chatHistory.update((history) => [...history, newMsg]);
  return newMsg;
}

export function clearChat() {
  chatHistory.set([]);
  errorMessage.set(null);
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      serverStatus.set('online');
      return true;
    }
    serverStatus.set('offline');
    return false;
  } catch (err) {
    serverStatus.set('offline');
    return false;
  }
}

export async function sendMessage(content: string) {
  const trimmed = content.trim();
  if (!trimmed || get(isTyping)) return;

  const currentModel = get(selectedModel);
  errorMessage.set(null);

  // Append user message
  addMessage('user', trimmed);
  isTyping.set(true);

  // Prepare payload from full conversation history for contextual memory (PRD 4.4)
  const history = get(chatHistory);
  const messagesPayload = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: currentModel,
        messages: messagesPayload,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const errorDetail = data.error || 'Failed to fetch AI response';
      errorMessage.set(errorDetail);
      addMessage(
        'assistant',
        `⚠️ **Error:** ${errorDetail}`,
        currentModel
      );
    } else if (data.message && data.message.content) {
      addMessage('assistant', data.message.content, currentModel);
    }
  } catch (err: any) {
    const errText = err?.message || 'Network error connecting to backend';
    errorMessage.set(errText);
    addMessage('assistant', `⚠️ **Network Error:** Could not reach the backend server at \`/api/chat\` (${errText}).`, currentModel);
  } finally {
    isTyping.set(false);
  }
}
