<script lang="ts">
  import { page } from "$app/stores"
</script>

{#if $page.path === "/tables"}
  <slot />
{:else}
  Subnavbar
  <slot />
{/if}
