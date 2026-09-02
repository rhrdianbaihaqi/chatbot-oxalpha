<script lang="ts">
  import { selectedModel, POPULAR_MODELS } from '../store';
  import { ChevronDownIcon, CpuIcon, CheckIcon, PlusIcon } from '../icons';

  let isOpen = false;
  let customModelInput = '';
  let showCustomInput = false;
  let triggerEl: HTMLButtonElement;

  $: currentModelInfo = POPULAR_MODELS.find((m) => m.id === $selectedModel) || {
    id: $selectedModel,
    name: $selectedModel.split('/').pop() || $selectedModel,
    provider: $selectedModel.includes('/') ? $selectedModel.split('/')[0] : 'Custom',
    description: 'Custom selected OpenRouter model',
  };

  function selectModel(modelId: string) {
    selectedModel.set(modelId);
    isOpen = false;
    showCustomInput = false;
  }

  function handleCustomSubmit() {
    const trimmed = customModelInput.trim();
    if (trimmed) {
      selectedModel.set(trimmed);
      customModelInput = '';
      showCustomInput = false;
      isOpen = false;
    }
  }

  function toggleOpen() {
    isOpen = !isOpen;
  }

  function closeAndFocusTrigger() {
    isOpen = false;
    triggerEl?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      closeAndFocusTrigger();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="relative">
  <!-- Trigger Button -->
  <button
    bind:this={triggerEl}
    type="button"
    on:click={toggleOpen}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-label="Select AI model, current: {currentModelInfo.name}"
    class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 text-xs font-medium border border-surface-200 dark:border-surface-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
  >
    <CpuIcon size={14} class="text-primary-500" />
    <span class="max-w-[140px] truncate">{currentModelInfo.name}</span>
    {#if currentModelInfo.badge}
      <span class="px-1.5 py-0.2 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-[10px] font-semibold rounded-md">
        {currentModelInfo.badge}
      </span>
    {/if}
    <ChevronDownIcon size={14} class="text-surface-500 dark:text-surface-400 transition-transform {isOpen ? 'rotate-180' : ''}" />
  </button>

  <!-- Backdrop for click outside -->
  {#if isOpen}
    <div
      class="fixed inset-0 z-40"
      on:click={closeAndFocusTrigger}
      on:keydown={() => {}}
      role="button"
      tabindex="-1"
      aria-label="Close dropdown"
    ></div>

    <!-- Dropdown Menu -->
    <div class="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-surface-800 rounded-2xl shadow-elevated border border-surface-200 dark:border-surface-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
      <div class="p-3 border-b border-surface-100 dark:border-surface-700 flex items-center justify-between bg-surface-50 dark:bg-surface-900">
        <div>
          <h4 class="text-xs font-semibold text-surface-800 dark:text-surface-200">Select AI Model</h4>
          <p class="text-[11px] text-surface-500 dark:text-surface-400">Choose an OpenRouter LLM backend</p>
        </div>
        <span class="text-[10px] font-mono bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 px-2 py-0.5 rounded">
          OpenRouter
        </span>
      </div>

      <!-- Models List -->
      <div class="max-h-72 overflow-y-auto p-1.5 divide-y divide-surface-100 dark:divide-surface-700" role="listbox" aria-label="Available AI models">
        {#each POPULAR_MODELS as model}
          <button
            type="button"
            role="option"
            aria-selected={$selectedModel === model.id}
            class="w-full text-left p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex items-start justify-between gap-3 group {$selectedModel === model.id ? 'bg-primary-50/50 dark:bg-primary-950/30' : ''}"
            on:click={() => selectModel(model.id)}
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-medium text-surface-900 dark:text-surface-100 group-hover:text-primary-600">
                  {model.name}
                </span>
                <span class="text-[10px] text-surface-400 dark:text-surface-500 font-mono">({model.provider})</span>
                {#if model.badge}
                  <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                    {model.badge}
                  </span>
                {/if}
              </div>
              <p class="text-[11px] text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-1">
                {model.description}
              </p>
            </div>

            {#if $selectedModel === model.id}
              <CheckIcon size={16} class="text-primary-500 flex-shrink-0 mt-0.5" />
            {/if}
          </button>
        {/each}
      </div>

      <!-- Custom Model Input Option -->
      <div class="p-2 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900">
        {#if !showCustomInput}
          <button
            type="button"
            class="w-full text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center justify-center gap-1.5 py-1.5 font-medium hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
            on:click={() => (showCustomInput = true)}
          >
            <PlusIcon size={14} />
            <span>Enter custom OpenRouter model ID</span>
          </button>
        {:else}
          <form on:submit|preventDefault={handleCustomSubmit} class="flex items-center gap-1.5">
            <input
              type="text"
              bind:value={customModelInput}
              placeholder="e.g. mistralai/mistral-large"
              class="flex-1 text-xs px-2.5 py-1.5 border border-surface-300 dark:border-surface-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100"
            />
            <button
              type="submit"
              disabled={!customModelInput.trim()}
              class="text-xs px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 font-medium"
            >
              Use
            </button>
          </form>
        {/if}
      </div>
    </div>
  {/if}
</div>
