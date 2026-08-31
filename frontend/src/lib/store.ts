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
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast, intelligent, and highly cost-effective model',
    badge: 'Popular',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Top-tier reasoning, code generation, and writing',
    badge: 'Pro',
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Powerful next-gen reasoning and code intelligence',
    badge: 'Trending',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Next-gen speed and multimodal intelligence',
  },
];

const CHAT_HISTORY_KEY = 'oxalpha:chatHistory';
const SELECTED_MODEL_KEY = 'oxalpha:selectedModel';

function readStoredJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Core stores as specified in PRD Section 6.1
export const chatHistory = writable<ChatMessage[]>(readStoredJSON(CHAT_HISTORY_KEY, []));
export const isTyping = writable<boolean>(false);
export const selectedModel = writable<string>(
  readStoredJSON(SELECTED_MODEL_KEY, 'openai/gpt-4o-mini')
);
export const serverStatus = writable<'checking' | 'online' | 'offline'>('checking');
export const errorMessage = writable<string | null>(null);
// Content of the last user message whose request failed, so the UI can offer a retry.
export const lastFailedMessage = writable<string | null>(null);

// Persist chat/model state across reloads so refreshing the tab doesn't lose the conversation.
chatHistory.subscribe((history) => {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to persist chat history:', err);
  }
});

selectedModel.subscribe((model) => {
  try {
    localStorage.setItem(SELECTED_MODEL_KEY, JSON.stringify(model));
  } catch (err) {
    console.error('Failed to persist selected model:', err);
  }
});

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

// Tracks the fetch for whatever sendMessage call is currently in flight, so a
// superseding call (e.g. clearChat) can cancel it instead of letting a late
// response resurrect state after the user has moved on.
let activeController: AbortController | null = null;

export function clearChat() {
  activeController?.abort();
  activeController = null;
  chatHistory.set([]);
  errorMessage.set(null);
  lastFailedMessage.set(null);
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
  lastFailedMessage.set(null);

  // Append user message
  addMessage('user', trimmed);
  isTyping.set(true);

  // Prepare payload from full conversation history for contextual memory (PRD 4.4)
  const history = get(chatHistory);
  const messagesPayload = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const controller = new AbortController();
  activeController = controller;

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
      signal: controller.signal,
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const errorDetail = data.error || 'Failed to fetch AI response';
      errorMessage.set(errorDetail);
      lastFailedMessage.set(trimmed);
      addMessage(
        'assistant',
        `⚠️ **Error:** ${errorDetail}`,
        currentModel
      );
    } else if (data.message && data.message.content) {
      addMessage('assistant', data.message.content, currentModel);
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // Request was intentionally cancelled (e.g. chat cleared) — nothing to surface.
      return;
    }
    const errText = err?.message || 'Network error connecting to backend';
    errorMessage.set(errText);
    lastFailedMessage.set(trimmed);
    addMessage('assistant', `⚠️ **Network Error:** Could not reach the backend server at \`/api/chat\` (${errText}).`, currentModel);
  } finally {
    if (activeController === controller) {
      activeController = null;
    }
    isTyping.set(false);
  }
}

export function retryLastMessage() {
  const content = get(lastFailedMessage);
  if (content) {
    sendMessage(content);
  }
}
