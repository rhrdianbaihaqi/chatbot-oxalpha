<script lang="ts">
  import { onMount } from 'svelte';
  import { isTyping, sendMessage } from '../store';
  import { ArrowUpIcon, SparklesIcon } from '../icons';

  let inputEl: HTMLTextAreaElement;
  let text = '';

  function adjustHeight() {
    if (!inputEl) return;
    inputEl.style.height = 'auto';
    const newHeight = Math.min(inputEl.scrollHeight, 200);
    inputEl.style.height = `${Math.max(newHeight, 48)}px`;
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || $isTyping) return;

    const messageToSend = trimmed;
    text = '';
    
    // Reset textarea height
    if (inputEl) {
      inputEl.style.height = '48px';
    }

    sendMessage(messageToSend);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  onMount(() => {
    if (inputEl) {
      inputEl.focus();
      adjustHeight();
    }
  });
</script>

<div class="w-full max-w-3xl mx-auto px-4 pb-4">
  <div class="relative bg-white border border-surface-300 rounded-3xl shadow-input focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-50 transition-all p-2 flex flex-col gap-1.5">
    <!-- Input area -->
    <div class="flex items-end gap-2 px-2">
      <textarea
        bind:this={inputEl}
        bind:value={text}
        on:input={adjustHeight}
        on:keydown={handleKeyDown}
        placeholder="Ask anything (e.g. explain quantum computing, write code, analyze data)..."
        rows="1"
        disabled={$isTyping}
        class="w-full resize-none bg-transparent border-0 focus:ring-0 focus:outline-none text-[0.95rem] text-surface-900 placeholder:text-surface-400 py-2.5 max-h-48 overflow-y-auto leading-relaxed disabled:opacity-60"
      ></textarea>

      <!-- Submit Action Button -->
      <button
        type="button"
        on:click={handleSubmit}
        disabled={!text.trim() || $isTyping}
        aria-label="Send message"
        class="flex-shrink-0 w-9 h-9 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-surface-200 disabled:text-surface-400 text-white flex items-center justify-center transition-all duration-150 shadow-sm disabled:shadow-none mb-1 disabled:cursor-not-allowed"
      >
        {#if $isTyping}
          <div class="w-4 h-4 border-2 border-surface-400 border-t-transparent rounded-full animate-spin"></div>
        {:else}
          <ArrowUpIcon size={18} strokeWidth={2.5} />
        {/if}
      </button>
    </div>

    <!-- Bottom info hint -->
    <div class="flex items-center justify-between px-2 pt-1 border-t border-surface-100 text-[11px] text-surface-400">
      <div class="flex items-center gap-1.5">
        <SparklesIcon size={12} class="text-primary-500" />
        <span>Powered by OpenRouter LLMs</span>
      </div>
      <div class="hidden sm:flex items-center gap-1">
        <span>Use</span>
        <kbd class="px-1 py-0.5 bg-surface-100 border border-surface-200 rounded text-[10px] font-mono">Shift</kbd>
        <span>+</span>
        <kbd class="px-1 py-0.5 bg-surface-100 border border-surface-200 rounded text-[10px] font-mono">Enter</kbd>
        <span>for newline</span>
      </div>
    </div>
  </div>
  <p class="text-center text-[11px] text-surface-400 mt-2">
    AI responses may vary in accuracy. Verify important information.
  </p>
</div>
