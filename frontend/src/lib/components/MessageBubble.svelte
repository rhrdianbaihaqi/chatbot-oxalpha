<script lang="ts">
  import type { ChatMessage } from '../store';
  import { renderMarkdown } from '../utils/markdown';
  import { BotIcon, UserIcon, CopyIcon, CheckIcon } from '../icons';

  export let message: ChatMessage;

  let copied = false;

  function copyMessageContent() {
    navigator.clipboard.writeText(message.content);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  function formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  $: renderedHtml = message.role === 'assistant' ? renderMarkdown(message.content) : '';
  $: isUser = message.role === 'user';
</script>

<div class="flex flex-col w-full group transition-opacity duration-200">
  {#if isUser}
    <!-- User Message Bubble (Right aligned) -->
    <div class="flex justify-end items-start gap-3 pl-10">
      <div class="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
        <div class="bg-surface-100 border border-surface-200 text-surface-900 px-4 py-3 rounded-2xl rounded-tr-sm text-[0.95rem] leading-relaxed shadow-sm break-words whitespace-pre-wrap">
          {message.content}
        </div>
        <span class="text-[11px] text-surface-500 mt-1 mr-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-surface-700 shadow-sm mt-0.5">
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
          <span class="text-xs font-semibold text-surface-800">AI Assistant</span>
          {#if message.model}
            <span class="text-[10px] font-mono px-2 py-0.5 bg-surface-100 text-surface-600 rounded-full border border-surface-200">
              {message.model.split('/').pop()}
            </span>
          {/if}
          <span class="text-[11px] text-surface-400">{formatTime(message.timestamp)}</span>
        </div>

        <!-- Rendered Message Body -->
        <div class="markdown-body w-full text-surface-900 bg-white p-1 break-words">
          {@html renderedHtml}
        </div>

        <!-- Action bar -->
        <div class="flex items-center gap-2 mt-2 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            class="flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-surface-100 hover:text-surface-700 transition-colors"
            on:click={copyMessageContent}
            title="Copy response"
          >
            {#if copied}
              <CheckIcon size={13} class="text-green-600" />
              <span class="text-green-600">Copied</span>
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
