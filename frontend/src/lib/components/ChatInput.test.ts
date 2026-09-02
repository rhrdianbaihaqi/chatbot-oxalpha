import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ChatInput from './ChatInput.svelte';
import { isTyping } from '../store';

vi.mock('../store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../store')>();
  return {
    ...actual,
    sendMessage: vi.fn(),
  };
});

import { sendMessage } from '../store';

beforeEach(() => {
  vi.mocked(sendMessage).mockClear();
  isTyping.set(false);
});

describe('ChatInput', () => {
  it('renders a labeled textarea and a send button', () => {
    render(ChatInput);
    expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('disables the send button until there is text', async () => {
    render(ChatInput);
    const sendButton = screen.getByLabelText('Send message');
    expect(sendButton).toBeDisabled();

    const textarea = screen.getByLabelText('Chat message input');
    await fireEvent.input(textarea, { target: { value: 'hello' } });

    expect(sendButton).not.toBeDisabled();
  });

  it('sends the trimmed message and clears the input on click', async () => {
    render(ChatInput);
    const textarea = screen.getByLabelText('Chat message input') as HTMLTextAreaElement;
    const sendButton = screen.getByLabelText('Send message');

    await fireEvent.input(textarea, { target: { value: '  hello world  ' } });
    await fireEvent.click(sendButton);

    expect(sendMessage).toHaveBeenCalledWith('hello world');
    expect(textarea.value).toBe('');
  });

  it('submits on Enter and does not submit on Shift+Enter', async () => {
    render(ChatInput);
    const textarea = screen.getByLabelText('Chat message input') as HTMLTextAreaElement;

    await fireEvent.input(textarea, { target: { value: 'first' } });
    await fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(sendMessage).not.toHaveBeenCalled();

    await fireEvent.input(textarea, { target: { value: 'second' } });
    await fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(sendMessage).toHaveBeenCalledWith('second');
  });

  it('does not send whitespace-only content', async () => {
    render(ChatInput);
    const textarea = screen.getByLabelText('Chat message input');

    await fireEvent.input(textarea, { target: { value: '   ' } });
    await fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('disables the textarea and send button while a request is in flight', async () => {
    isTyping.set(true);
    render(ChatInput);

    expect(screen.getByLabelText('Chat message input')).toBeDisabled();
    expect(screen.getByLabelText('Send message')).toBeDisabled();
  });
});
