<script lang="ts">
  export let segment: string | undefined
</script>

{#if segment === undefined}
  <slot />
{:else}
  Subnavbar
  <slot />
{/if}
