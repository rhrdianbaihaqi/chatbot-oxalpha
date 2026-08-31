<script lang="ts">
  import { onMount } from 'svelte';
  import {
    chatHistory,
    clearChat,
    serverStatus,
    checkServerHealth,
    errorMessage,
    lastFailedMessage,
    retryLastMessage,
    isTyping,
  } from './lib/store';
  import ChatWindow from './lib/components/ChatWindow.svelte';
  import ChatInput from './lib/components/ChatInput.svelte';
  import ModelSelector from './lib/components/ModelSelector.svelte';
  import { BotIcon, TrashIcon, AlertCircleIcon, RefreshIcon } from './lib/icons';

  onMount(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(interval);
  });
</script>

<div class="flex flex-col h-screen bg-white text-surface-900 overflow-hidden font-sans">
  <!-- Top Navigation / Header -->
  <header class="h-16 border-b border-surface-200 bg-white/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
    <!-- Brand / Title -->
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-sm">
        <BotIcon size={20} />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-semibold text-surface-900 tracking-tight leading-none">
            OxAlpha AI
          </h1>
          <span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-surface-100 text-surface-600 rounded border border-surface-200">
            MVP
          </span>
        </div>
        <!-- Server health status indicator -->
        <div class="flex items-center gap-1.5 mt-0.5">
          {#if $serverStatus === 'online'}
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-[11px] text-emerald-600 font-medium">Backend Ready</span>
          {:else if $serverStatus === 'offline'}
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span class="text-[11px] text-rose-600 font-medium">Backend Offline</span>
          {:else}
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="text-[11px] text-surface-500">Checking status...</span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Actions & Model Selector -->
    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Model Selector Component -->
      <ModelSelector />

      <!-- Clear Chat Button -->
      {#if $chatHistory.length > 0}
        <button
          type="button"
          on:click={clearChat}
          class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-surface-600 hover:text-rose-600 hover:bg-rose-50 border border-surface-200 transition-colors"
          title="Clear Conversation"
        >
          <TrashIcon size={13} />
          <span class="hidden sm:inline">Clear</span>
        </button>
      {/if}
    </div>
  </header>

  <!-- Error Banner if any -->
  {#if $errorMessage}
    <div class="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-800">
      <div class="flex items-center gap-2 min-w-0">
        <AlertCircleIcon size={15} class="text-rose-600 flex-shrink-0" />
        <span class="truncate">{$errorMessage}</span>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        {#if $lastFailedMessage}
          <button
            type="button"
            on:click={retryLastMessage}
            disabled={$isTyping}
            class="flex items-center gap-1 text-rose-700 hover:text-rose-900 font-medium px-2 py-0.5 rounded hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshIcon size={12} />
            Retry
          </button>
        {/if}
        <button
          type="button"
          on:click={() => errorMessage.set(null)}
          class="text-rose-600 hover:text-rose-900 font-bold px-1"
        >
          ×
        </button>
      </div>
    </div>
  {/if}

  <!-- Main Chat Content -->
  <main class="flex-1 flex flex-col min-h-0 relative">
    <ChatWindow />
    <ChatInput />
  </main>
</div>
