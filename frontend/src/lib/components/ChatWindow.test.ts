import { describe, it, expect, beforeEach } from 'vitest';
import { tick } from 'svelte';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChatWindow from './ChatWindow.svelte';
import { chatHistory, type ChatMessage } from '../store';

function makeMessages(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i}`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `message ${i}`,
    timestamp: Date.now() + i,
  }));
}

beforeEach(() => {
  chatHistory.set([]);
});

describe('ChatWindow', () => {
  it('shows the empty/welcome state when there is no history', () => {
    render(ChatWindow);
    expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
  });

  it('renders every message with no "load older" control when under the window size', () => {
    chatHistory.set(makeMessages(10));
    render(ChatWindow);

    expect(screen.getByText('message 0')).toBeInTheDocument();
    expect(screen.getByText('message 9')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /load .* older/i })).not.toBeInTheDocument();
  });

  it('only renders the most recent window and offers to load older messages once history is long', () => {
    chatHistory.set(makeMessages(70));
    render(ChatWindow);

    // Oldest messages are outside the default window of 50...
    expect(screen.queryByText('message 0')).not.toBeInTheDocument();
    expect(screen.queryByText('message 19')).not.toBeInTheDocument();
    // ...but the most recent ones are still there.
    expect(screen.getByText('message 20')).toBeInTheDocument();
    expect(screen.getByText('message 69')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /load 20 older messages \(20 hidden\)/i })
    ).toBeInTheDocument();
  });

  it('reveals the remaining older messages when "load older" is clicked', async () => {
    chatHistory.set(makeMessages(70));
    render(ChatWindow);

    await fireEvent.click(screen.getByRole('button', { name: /load .* older/i }));

    expect(screen.getByText('message 0')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /load .* older/i })).not.toBeInTheDocument();
  });

  it('resets the visible window when the chat is cleared', async () => {
    chatHistory.set(makeMessages(70));
    render(ChatWindow);
    await fireEvent.click(screen.getByRole('button', { name: /load .* older/i }));
    expect(screen.getByText('message 0')).toBeInTheDocument();

    chatHistory.set([]);
    await tick();
    expect(screen.getByText('How can I help you today?')).toBeInTheDocument();

    chatHistory.set(makeMessages(70));
    await tick();
    // Window should be back to the default 50, not still fully expanded.
    expect(
      screen.getByRole('button', { name: /load 20 older messages \(20 hidden\)/i })
    ).toBeInTheDocument();
  });
});
