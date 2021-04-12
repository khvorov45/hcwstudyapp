<script lang="ts">
  import { page } from "$app/stores"
  import Subnav from "$lib/components/Subnav.svelte"
  import type { SubnavLink } from "$lib/util"
  import Link from "$lib/components/Link.svelte"
  import TextContainer from "$lib/components/TextContainer.svelte"

  const tableLinks: SubnavLink[] = [
    {
      link: "/tables/contact",
      title: "Contact",
      width: "100px",
    },
    {
      link: "/tables/baseline",
      title: "Baseline",
      width: "100px",
    },
  ]
</script>

{#if $page.path === "/tables"}
  <TextContainer>
    <h1>Tables</h1>
    <ul>
      {#each tableLinks as link}
        <li><Link href={link.link}>{link.title}</Link></li>
      {/each}
    </ul>
  </TextContainer>
{:else}
  <Subnav links={tableLinks} />
  <slot />
{/if}

<style>
  li {
    font-size: 16px;
    margin-bottom: 10px;
  }
</style>
