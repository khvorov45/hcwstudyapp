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
      width: 100,
    },
    {
      link: "/tables/baseline",
      title: "Baseline",
      width: 100,
    },
    {
      link: "/tables/vaccination",
      title: "Vaccination",
      width: 100,
    },
    {
      link: "/tables/schedule",
      title: "Schedule",
      width: 100,
    },
    {
      link: "/tables/weekly-survey",
      title: "Weekly survey",
      width: 150,
    },
    {
      link: "/tables/weekly-completion",
      title: "Weekly completion",
      width: 150,
    },
    {
      link: "/tables/withdrawn",
      title: "Withdrawn",
      width: 100,
    },
    {
      link: "/tables/virus",
      title: "Virus",
      width: 100,
    },
    {
      link: "/tables/serology",
      title: "Serology",
      width: 100,
    },
    {
      link: "/tables/summary-titre",
      title: "Titre summary",
      width: 120,
    },
    {
      link: "/tables/demographics",
      title: "Demographics",
      width: 100,
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
