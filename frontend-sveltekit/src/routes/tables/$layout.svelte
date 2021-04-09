<script lang="ts">
  import { page } from "$app/stores"
  import Subnav from "$lib/components/Subnav.svelte"
</script>

{#if $page.path === "/tables"}
  <slot />
{:else}
  <Subnav />
  <slot />
{/if}
