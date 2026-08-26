<script lang="ts">
  export let size = 18;
  export let strokeWidth = 2.5;
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
  <path d="m5 12 7-7 7 7" />
  <path d="M12 19V5" />
</svg>
