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
    const currentLength = $chatHistory.length;
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
    {#if $chatHistory.length === 0}
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
      <!-- Chat Messages List -->
      {#each $chatHistory as msg (msg.id)}
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
