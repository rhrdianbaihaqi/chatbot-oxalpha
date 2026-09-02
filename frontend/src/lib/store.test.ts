import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  chatHistory,
  isTyping,
  selectedModel,
  serverStatus,
  errorMessage,
  lastFailedMessage,
  addMessage,
  clearChat,
  checkServerHealth,
  sendMessage,
  retryLastMessage,
} from './store';

function mockFetchOnce(response: Partial<Response> & { jsonBody?: unknown }) {
  const { jsonBody, ...rest } = response;
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => jsonBody,
      ...rest,
    } as Response)
  );
}

beforeEach(() => {
  localStorage.clear();
  clearChat();
  isTyping.set(false);
  serverStatus.set('checking');
  vi.unstubAllGlobals();
});

describe('addMessage', () => {
  it('appends a message with a generated id and timestamp', () => {
    const msg = addMessage('user', 'hello');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('hello');
    expect(msg.id).toMatch(/^msg-/);
    expect(get(chatHistory)).toEqual([msg]);
  });
});

describe('clearChat', () => {
  it('empties history and clears error/retry state', () => {
    addMessage('user', 'hello');
    errorMessage.set('boom');
    lastFailedMessage.set('hello');

    clearChat();

    expect(get(chatHistory)).toEqual([]);
    expect(get(errorMessage)).toBeNull();
    expect(get(lastFailedMessage)).toBeNull();
  });
});

describe('checkServerHealth', () => {
  it('sets serverStatus to online when the backend responds ok', async () => {
    mockFetchOnce({ ok: true });
    const result = await checkServerHealth();
    expect(result).toBe(true);
    expect(get(serverStatus)).toBe('online');
  });

  it('sets serverStatus to offline when the backend responds not-ok', async () => {
    mockFetchOnce({ ok: false });
    const result = await checkServerHealth();
    expect(result).toBe(false);
    expect(get(serverStatus)).toBe('offline');
  });

  it('sets serverStatus to offline when the fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const result = await checkServerHealth();
    expect(result).toBe(false);
    expect(get(serverStatus)).toBe('offline');
  });
});

describe('sendMessage', () => {
  it('ignores empty/whitespace-only content', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await sendMessage('   ');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(get(chatHistory)).toEqual([]);
  });

  it('ignores calls made while a request is already in flight', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    isTyping.set(true);

    await sendMessage('hello');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('appends the assistant reply on a successful response', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: { success: true, message: { content: 'Hi there!' } },
    });

    await sendMessage('hello');

    const history = get(chatHistory);
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({ role: 'user', content: 'hello' });
    expect(history[1]).toMatchObject({ role: 'assistant', content: 'Hi there!' });
    expect(get(isTyping)).toBe(false);
    expect(get(errorMessage)).toBeNull();
    expect(get(lastFailedMessage)).toBeNull();
  });

  it('records an error and the failed message when the API reports failure', async () => {
    mockFetchOnce({
      ok: true,
      jsonBody: { success: false, error: 'Model not found' },
    });

    await sendMessage('hello');

    expect(get(errorMessage)).toBe('Model not found');
    expect(get(lastFailedMessage)).toBe('hello');
    expect(get(chatHistory).at(-1)).toMatchObject({
      role: 'assistant',
      content: expect.stringContaining('Model not found'),
    });
    expect(get(isTyping)).toBe(false);
  });

  it('records a network error and the failed message when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await sendMessage('hello');

    expect(get(errorMessage)).toBe('offline');
    expect(get(lastFailedMessage)).toBe('hello');
    expect(get(chatHistory).at(-1)).toMatchObject({ role: 'assistant' });
    expect(get(isTyping)).toBe(false);
  });

  it('cancels the in-flight request when the chat is cleared, without resurrecting state', async () => {
    let rejectFetch: (reason?: unknown) => void = () => {};
    const pending = new Promise((_resolve, reject) => {
      rejectFetch = reject;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, opts: RequestInit) => {
        opts.signal?.addEventListener('abort', () => {
          rejectFetch(new DOMException('Aborted', 'AbortError'));
        });
        return pending;
      })
    );

    const sendPromise = sendMessage('will be cancelled');
    // sendMessage runs synchronously up to the fetch() call, so by this point
    // the request (and its AbortController) is already registered.
    clearChat();
    await sendPromise;

    expect(get(chatHistory)).toEqual([]);
    expect(get(errorMessage)).toBeNull();
    expect(get(isTyping)).toBe(false);
  });
});

describe('retryLastMessage', () => {
  it('does nothing when there is no failed message', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    retryLastMessage();
    await Promise.resolve();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('re-sends the last failed message content', async () => {
    mockFetchOnce({ ok: true, jsonBody: { success: false, error: 'boom' } });
    await sendMessage('please retry me');
    expect(get(lastFailedMessage)).toBe('please retry me');

    mockFetchOnce({ ok: true, jsonBody: { success: true, message: { content: 'ok now' } } });
    retryLastMessage();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const contents = get(chatHistory).map((m) => m.content);
    expect(contents.filter((c) => c === 'please retry me')).toHaveLength(2);
    expect(contents.at(-1)).toBe('ok now');
    expect(get(lastFailedMessage)).toBeNull();
  });
});

describe('localStorage persistence', () => {
  it('persists chat history writes under the namespaced key', () => {
    addMessage('user', 'persisted message');

    const stored = JSON.parse(localStorage.getItem('oxalpha:chatHistory') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].content).toBe('persisted message');
  });

  it('persists selectedModel writes under the namespaced key', () => {
    selectedModel.set('anthropic/claude-3.5-sonnet');

    const stored = JSON.parse(localStorage.getItem('oxalpha:selectedModel') ?? 'null');
    expect(stored).toBe('anthropic/claude-3.5-sonnet');
  });

  it('hydrates chatHistory and selectedModel from localStorage on module load', async () => {
    localStorage.setItem(
      'oxalpha:chatHistory',
      JSON.stringify([{ id: 'x', role: 'user', content: 'hi', timestamp: 1 }])
    );
    localStorage.setItem('oxalpha:selectedModel', JSON.stringify('anthropic/claude-3.5-sonnet'));

    vi.resetModules();
    const fresh = await import('./store');

    expect(get(fresh.chatHistory)).toEqual([
      { id: 'x', role: 'user', content: 'hi', timestamp: 1 },
    ]);
    expect(get(fresh.selectedModel)).toBe('anthropic/claude-3.5-sonnet');
  });

  it('falls back to defaults when localStorage holds corrupted JSON', async () => {
    localStorage.setItem('oxalpha:chatHistory', 'not-json{{{');

    vi.resetModules();
    const fresh = await import('./store');

    expect(get(fresh.chatHistory)).toEqual([]);
  });
});
