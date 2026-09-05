import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ModelSelector from './ModelSelector.svelte';
import { selectedModel } from '../store';

beforeEach(() => {
  selectedModel.set('nvidia/nemotron-3.5-lightning:free');
});

describe('ModelSelector', () => {
  it('shows the currently selected model on the trigger button', () => {
    render(ModelSelector);
    const trigger = screen.getByRole('button', { name: /select ai model/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.textContent).toContain('Nemotron 3.5 Lightning');
  });

  it('opens the dropdown as a listbox with the popular models', async () => {
    render(ModelSelector);
    const trigger = screen.getByRole('button', { name: /select ai model/i });

    await fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox', { name: /available ai models/i });
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(4);
    expect(listbox).toBeInTheDocument();
  });

  it('selects a model, closes the dropdown, and marks it as selected', async () => {
    render(ModelSelector);
    await fireEvent.click(screen.getByRole('button', { name: /select ai model/i }));

    const otherOption = screen.getByRole('option', { name: /LFM 2.5/i });
    await fireEvent.click(otherOption);

    expect(selectedModel).toBeDefined();
    // Dropdown should close after selection.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /select ai model/i });
    expect(trigger.textContent).toContain('LFM 2.5');
  });

  it('closes the dropdown on Escape', async () => {
    render(ModelSelector);
    const trigger = screen.getByRole('button', { name: /select ai model/i });
    await fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('accepts a custom OpenRouter model id', async () => {
    render(ModelSelector);
    await fireEvent.click(screen.getByRole('button', { name: /select ai model/i }));
    await fireEvent.click(screen.getByText(/enter custom openrouter model id/i));

    const input = screen.getByPlaceholderText(/mistralai\/mistral-large/i);
    await fireEvent.input(input, { target: { value: 'mistralai/mistral-large' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Use' }));

    const trigger = screen.getByRole('button', { name: /select ai model/i });
    expect(trigger.textContent).toContain('mistral-large');
  });
});
