<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { chatHistory, isTyping, sendMessage } from '../store';
  import MessageBubble from './MessageBubble.svelte';
  import { BotIcon, SparklesIcon, CodeIcon, LightbulbIcon, CompassIcon } from '../icons';

  let messagesContainer: HTMLDivElement;

  const starterPrompts = [
    {
      title: 'Explain a Concept',
      desc: 'Explain quantum computing in simple terms with analogies',
      icon: LightbulbIcon,
    },
    {
      title: 'Code Generation',
      desc: 'Write an ElysiaJS middleware to log response time and request ID',
      icon: CodeIcon,
    },
    {
      title: 'System Design',
      desc: 'Design a high-throughput webhook processing architecture',
      icon: CompassIcon,
    },
    {
      title: 'Creative Writing',
      desc: 'Draft a concise executive summary for an AI startup pitch',
      icon: SparklesIcon,
    },
  ];

  let prevLength = 0;

  // Rendering the full history gets expensive once a conversation runs long
  // (every message re-parses/highlights markdown). Only render the most
  // recent window by default, with a "load older" boundary to reveal more —
  // simpler and cheaper than scroll-position virtualization for a chat list
  // that's almost always read from the bottom up.
  const INITIAL_VISIBLE_COUNT = 50;
  const LOAD_MORE_STEP = 50;

  let visibleCount = INITIAL_VISIBLE_COUNT;
  let pendingScrollAdjust = false;
  let scrollHeightBeforeLoadMore = 0;

  $: totalCount = $chatHistory.length;
  $: hiddenCount = Math.max(0, totalCount - visibleCount);
  $: visibleMessages = $chatHistory.slice(-visibleCount);
  $: if (totalCount === 0) visibleCount = INITIAL_VISIBLE_COUNT;

  function loadOlderMessages() {
    if (messagesContainer) {
      scrollHeightBeforeLoadMore = messagesContainer.scrollHeight;
      pendingScrollAdjust = true;
    }
    visibleCount += LOAD_MORE_STEP;
  }

  function scrollToBottom(force = false) {
    if (!messagesContainer) return;
    const distanceFromBottom =
      messagesContainer.scrollHeight -
      messagesContainer.scrollTop -
      messagesContainer.clientHeight;

    // Auto-scroll if forced or user is already close to the bottom (within 200px)
    if (force || distanceFromBottom < 200) {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  afterUpdate(() => {
    // Older messages were just prepended above the current viewport — keep
    // the user's visual position stable instead of letting the prepend
    // shove everything down (or auto-scrolling, which would be jarring).
    if (pendingScrollAdjust && messagesContainer) {
      messagesContainer.scrollTop += messagesContainer.scrollHeight - scrollHeightBeforeLoadMore;
      pendingScrollAdjust = false;
      prevLength = visibleMessages.length;
      return;
    }

    const currentLength = visibleMessages.length;
    if (currentLength !== prevLength || $isTyping) {
      scrollToBottom(currentLength > prevLength);
      prevLength = currentLength;
    }
  });

  function handlePromptClick(desc: string) {
    sendMessage(desc);
  }
</script>

<div
  bind:this={messagesContainer}
  class="flex-1 overflow-y-auto w-full px-4 sm:px-6 py-6 scroll-smooth"
>
  <div class="max-w-3xl mx-auto flex flex-col gap-6 min-h-full">
    {#if totalCount === 0}
      <!-- Empty / Welcome State (Google-esque Minimalist Hero) -->
      <div class="flex-1 flex flex-col items-center justify-center text-center my-auto py-10 animate-in fade-in duration-300">
        <!-- Logo / Icon -->
        <div class="w-16 h-16 rounded-3xl bg-primary-50 dark:bg-primary-950/40 text-primary-500 flex items-center justify-center mb-6 shadow-sm border border-primary-100 dark:border-primary-900">
          <BotIcon size={36} />
        </div>

        <h2 class="text-2xl sm:text-3xl font-semibold text-surface-900 dark:text-surface-100 tracking-tight">
          How can I help you today?
        </h2>
        <p class="text-sm text-surface-500 dark:text-surface-400 max-w-md mt-2 leading-relaxed">
          Powered by Elysia and OpenRouter. Select your preferred model and start chatting.
        </p>

        <!-- Prompt Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-8">
          {#each starterPrompts as prompt}
            {@const IconComponent = prompt.icon}
            <button
              type="button"
              on:click={() => handlePromptClick(prompt.desc)}
              class="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-50 dark:bg-surface-800/60 hover:bg-surface-100/80 dark:hover:bg-surface-800 border border-surface-200 dark:border-surface-700 text-left transition-all hover:shadow-sm group focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <div class="p-2 rounded-xl bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-300 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/40 border border-surface-200 dark:border-surface-700 transition-colors">
                <IconComponent size={18} />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-xs font-semibold text-surface-800 dark:text-surface-200 group-hover:text-primary-600">
                  {prompt.title}
                </h4>
                <p class="text-[12px] text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-2 leading-snug">
                  {prompt.desc}
                </p>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Load Older Messages Boundary -->
      {#if hiddenCount > 0}
        <div class="flex justify-center py-1">
          <button
            type="button"
            on:click={loadOlderMessages}
            class="text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700 rounded-full px-4 py-1.5 transition-colors"
          >
            Load {Math.min(hiddenCount, LOAD_MORE_STEP)} older messages ({hiddenCount} hidden)
          </button>
        </div>
      {/if}

      <!-- Chat Messages List -->
      {#each visibleMessages as msg (msg.id)}
        <MessageBubble message={msg} />
      {/each}

      <!-- Typing / Generating indicator -->
      {#if $isTyping}
        <div class="flex items-start gap-3 pr-10 animate-in fade-in duration-200">
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-sm">
            <BotIcon size={18} />
          </div>
          <div class="flex items-center gap-1.5 px-4 py-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl rounded-tl-sm text-surface-500 dark:text-surface-400 text-xs">
            <span class="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style="animation-delay: 300ms"></span>
            <span class="ml-2 font-medium text-surface-600 dark:text-surface-300">Thinking...</span>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
