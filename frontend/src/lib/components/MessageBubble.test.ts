import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MessageBubble from './MessageBubble.svelte';
import type { ChatMessage } from '../store';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'hello world',
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe('MessageBubble', () => {
  it('renders a user message as plain text, right-aligned', () => {
    render(MessageBubble, { props: { message: makeMessage({ role: 'user' }) } });
    expect(screen.getByText('hello world')).toBeInTheDocument();
  });

  it('renders an assistant message as sanitized markdown', () => {
    render(MessageBubble, {
      props: { message: makeMessage({ role: 'assistant', content: '**bold reply**' }) },
    });
    const strong = document.querySelector('.markdown-body strong');
    expect(strong).not.toBeNull();
    expect(strong?.textContent).toBe('bold reply');
  });

  it('never renders script tags from assistant content (XSS regression)', () => {
    render(MessageBubble, {
      props: {
        message: makeMessage({
          role: 'assistant',
          content: 'safe text <script>window.__pwned = true<\/script>',
        }),
      },
    });
    expect(document.querySelector('script')).toBeNull();
  });

  it('shows the model badge for assistant messages when present', () => {
    render(MessageBubble, {
      props: { message: makeMessage({ role: 'assistant', content: 'hi', model: 'openai/gpt-4o-mini' }) },
    });
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
  });

  it('shows a token usage badge labeled free when the model cost nothing', () => {
    render(MessageBubble, {
      props: {
        message: makeMessage({
          role: 'assistant',
          content: 'hi',
          usage: { promptTokens: 18, completionTokens: 224, totalTokens: 242, cost: 0 },
        }),
      },
    });
    expect(screen.getByText('242 tok · free')).toBeInTheDocument();
  });

  it('shows the cost instead of "free" when the model was billed', () => {
    render(MessageBubble, {
      props: {
        message: makeMessage({
          role: 'assistant',
          content: 'hi',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30, cost: 0.0012 },
        }),
      },
    });
    expect(screen.getByText('30 tok')).toBeInTheDocument();
  });

  it('omits the usage badge when no usage data is present', () => {
    render(MessageBubble, {
      props: { message: makeMessage({ role: 'assistant', content: 'hi' }) },
    });
    expect(screen.queryByText(/tok/)).not.toBeInTheDocument();
  });

  it('copies the message content when the copy button is clicked', async () => {
    const { fireEvent } = await import('@testing-library/svelte');
    render(MessageBubble, {
      props: { message: makeMessage({ role: 'assistant', content: 'copy me' }) },
    });

    const copyButton = screen.getByRole('button', { name: /copy text/i });
    await fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy me');
    expect(await screen.findByText('Copied')).toBeInTheDocument();
  });
});
