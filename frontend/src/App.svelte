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
  import { theme, toggleTheme } from './lib/theme';
  import { BotIcon, TrashIcon, AlertCircleIcon, RefreshIcon, SunIcon, MoonIcon } from './lib/icons';

  onMount(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000);
    return () => clearInterval(interval);
  });

  // Most chatbots hide token usage entirely — surfacing it (and that it's
  // running on $0-cost models) is a deliberate point of difference here.
  $: sessionUsage = $chatHistory.reduce(
    (acc, m) => {
      if (m.usage) {
        acc.totalTokens += m.usage.totalTokens;
        acc.cost += m.usage.cost;
      }
      return acc;
    },
    { totalTokens: 0, cost: 0 }
  );

  function formatSessionTokens(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }
</script>

<div class="flex flex-col h-screen bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 overflow-hidden font-sans">
  <!-- Top Navigation / Header -->
  <header class="h-16 border-b border-surface-200 dark:border-surface-800 bg-white/90 dark:bg-surface-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-xs">
    <!-- Brand / Title -->
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center shadow-sm">
        <BotIcon size={20} />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-sm sm:text-base font-semibold text-surface-900 dark:text-surface-100 tracking-tight leading-none">
            OxAlpha AI
          </h1>
          <span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 rounded border border-surface-200 dark:border-surface-700">
            MVP
          </span>
        </div>
        <!-- Server health status indicator -->
        <div class="flex items-center gap-1.5 mt-0.5">
          {#if $serverStatus === 'online'}
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Backend Ready</span>
          {:else if $serverStatus === 'offline'}
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span class="text-[11px] text-rose-600 dark:text-rose-400 font-medium">Backend Offline</span>
          {:else}
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="text-[11px] text-surface-500 dark:text-surface-400">Checking status...</span>
          {/if}
          {#if sessionUsage.totalTokens > 0}
            <span class="text-surface-300 dark:text-surface-700">·</span>
            <span
              class="text-[11px] text-surface-500 dark:text-surface-400"
              title="Cumulative token usage this session, across all models used"
            >
              {formatSessionTokens(sessionUsage.totalTokens)} tokens · {sessionUsage.cost > 0 ? `$${sessionUsage.cost.toFixed(4)}` : '$0.00'}
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Actions & Model Selector -->
    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Theme Toggle -->
      <button
        type="button"
        on:click={toggleTheme}
        class="flex items-center justify-center w-8 h-8 rounded-full text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-700 transition-colors"
        aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {#if $theme === 'dark'}
          <SunIcon size={15} />
        {:else}
          <MoonIcon size={15} />
        {/if}
      </button>

      <!-- Model Selector Component -->
      <ModelSelector />

      <!-- Clear Chat Button -->
      {#if $chatHistory.length > 0}
        <button
          type="button"
          on:click={clearChat}
          class="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-surface-600 dark:text-surface-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-surface-200 dark:border-surface-700 transition-colors"
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
    <div class="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 px-4 py-2 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
      <div class="flex items-center gap-2 min-w-0">
        <AlertCircleIcon size={15} class="text-rose-600 dark:text-rose-400 flex-shrink-0" />
        <span class="truncate">{$errorMessage}</span>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        {#if $lastFailedMessage}
          <button
            type="button"
            on:click={retryLastMessage}
            disabled={$isTyping}
            class="flex items-center gap-1 text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100 font-medium px-2 py-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshIcon size={12} />
            Retry
          </button>
        {/if}
        <button
          type="button"
          on:click={() => errorMessage.set(null)}
          class="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-100 font-bold px-1"
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
