<script lang="ts">
  import { page } from "$app/stores"
  import Subnav from "$lib/components/Subnav.svelte"
  import type { SubnavLink } from "$lib/util"
  import Link from "$lib/components/Link.svelte"
  import TextContainer from "$lib/components/TextContainer.svelte"

  const plotLinks: SubnavLink[] = [
    {
      link: "/plots/baseline",
      title: "Baseline",
      width: 100,
    },
    {
      link: "/plots/serology",
      title: "Serology",
      width: 100,
    },
  ]
</script>

{#if $page.path === "/plots"}
  <TextContainer>
    <h1>Plots</h1>
    <ul>
      {#each plotLinks as link}
        <li><Link href={link.link}>{link.title}</Link></li>
      {/each}
    </ul>
  </TextContainer>
{:else}
  <Subnav links={plotLinks} />
  <slot />
{/if}

<style>
  li {
    font-size: 16px;
    margin-bottom: 10px;
  }
</style>
