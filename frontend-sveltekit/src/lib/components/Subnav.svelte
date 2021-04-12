<script lang="ts">
  import Button from "./Button.svelte"
  import type { SubnavLink } from "$lib/util"
  import { page } from "$app/stores"

  export let links: SubnavLink[] = []
</script>

<div class="subnav">
  {#each links as link}
    <div class="element">
      <a href={link.link}
        ><Button
          width={link.width}
          active={$page.path === link.link}
          height="var(--size-nav)">{link.title}</Button
        ></a
      >
    </div>
  {/each}
</div>

<style>
  a {
    color: inherit;
    text-decoration: none;
  }
  .subnav {
    display: flex;
    height: var(--size-nav);
    border-bottom: 1px solid var(--color-bg-2);
  }
</style>
