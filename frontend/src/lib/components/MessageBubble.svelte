<script lang="ts">
  import type { ChatMessage } from '../store';
  import { renderMarkdown } from '../utils/markdown';
  import { BotIcon, UserIcon, CopyIcon, CheckIcon } from '../icons';

  export let message: ChatMessage;

  let copied = false;

  async function copyMessageContent() {
    try {
      await navigator.clipboard.writeText(message.content);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message content:', err);
    }
  }

  // Code blocks are rendered via {@html}, so their copy buttons can't carry
  // Svelte event handlers directly — handle clicks via delegation instead.
  async function handleBodyClick(e: MouseEvent) {
    const btn = (e.target as HTMLElement)?.closest<HTMLButtonElement>('.copy-code-btn');
    if (!btn) return;

    const code = decodeURIComponent(btn.dataset.code ?? '');
    try {
      await navigator.clipboard.writeText(code);
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Copied!';
      btn.classList.add('text-green-400');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('text-green-400');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code block:', err);
    }
  }

  function formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatTokenCount(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  $: renderedHtml = message.role === 'assistant' ? renderMarkdown(message.content) : '';
  $: isUser = message.role === 'user';
</script>

<div class="flex flex-col w-full group transition-opacity duration-200">
  {#if isUser}
    <!-- User Message Bubble (Right aligned) -->
    <div class="flex justify-end items-start gap-3 pl-10">
      <div class="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
        <div class="bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 px-4 py-3 rounded-2xl rounded-tr-sm text-[0.95rem] leading-relaxed shadow-sm break-words whitespace-pre-wrap">
          {message.content}
        </div>
        <span class="text-[11px] text-surface-500 dark:text-surface-400 mt-1 mr-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center text-surface-700 dark:text-surface-200 shadow-sm mt-0.5">
        <UserIcon size={16} />
      </div>
    </div>
  {:else}
    <!-- Assistant Message Bubble (Left aligned) -->
    <div class="flex justify-start items-start gap-3 pr-10">
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-sm mt-0.5">
        <BotIcon size={18} />
      </div>

      <div class="flex flex-col items-start flex-1 min-w-0 max-w-[92%] sm:max-w-[85%]">
        <!-- Header Info -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-semibold text-surface-800 dark:text-surface-200">AI Assistant</span>
          {#if message.model}
            <span class="text-[10px] font-mono px-2 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded-full border border-surface-200 dark:border-surface-700">
              {message.model.split('/').pop()}
            </span>
          {/if}
          {#if message.usage}
            <span
              class="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-900"
              title="{message.usage.promptTokens} prompt + {message.usage.completionTokens} completion tokens{message.usage.cost > 0 ? ` · $${message.usage.cost.toFixed(4)}` : ' · $0.00 (free model)'}"
            >
              {formatTokenCount(message.usage.totalTokens)} tok{message.usage.cost === 0 ? ' · free' : ''}
            </span>
          {/if}
          <span class="text-[11px] text-surface-400 dark:text-surface-500">{formatTime(message.timestamp)}</span>
        </div>

        <!-- Rendered Message Body -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="markdown-body w-full text-surface-900 dark:text-surface-100 bg-white dark:bg-transparent p-1 break-words"
          on:click={handleBodyClick}
        >
          {@html renderedHtml}
        </div>

        <!-- Action bar -->
        <div class="flex items-center gap-2 mt-2 text-surface-400 dark:text-surface-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            class="flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
            on:click={copyMessageContent}
            title="Copy response"
          >
            {#if copied}
              <CheckIcon size={13} class="text-green-600 dark:text-green-400" />
              <span class="text-green-600 dark:text-green-400">Copied</span>
            {:else}
              <CopyIcon size={13} />
              <span>Copy text</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
