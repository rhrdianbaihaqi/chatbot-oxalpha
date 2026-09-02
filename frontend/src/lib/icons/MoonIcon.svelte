<script lang="ts">
  export let size = 16;
  export let strokeWidth = 2;
  let customClass = '';
  export { customClass as class };
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={customClass}
>
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
</svg>
