<script lang="ts">
  import { page } from "$app/stores"
  import Subnav from "$lib/components/Subnav.svelte"
  import type { SubnavLink } from "$lib/util"

  const tableLinks: SubnavLink[] = [
    {
      link: "/tables/contact",
      title: "Contact",
      width: "100px",
    },
  ]
</script>

{#if $page.path === "/tables"}
  <slot />
{:else}
  <Subnav links={tableLinks} />
  <slot />
{/if}
