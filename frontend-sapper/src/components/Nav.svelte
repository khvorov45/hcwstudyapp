<script lang="ts">
  import { loginStatus } from "../lib/state"
  import Link from "./Link.svelte"

  export let segment: string | undefined
</script>

<nav>
  <div class="group">
    <div class:active={segment === undefined} class="element">
      <Link href="/">Home</Link>
    </div>
    <hr class="element" />
    {#if $loginStatus.status === "success"}
      <div class:active={segment === "protected"} class="element">
        <Link href="protected">Protected</Link>
      </div>
    {/if}
  </div>

  <div class="group">
    <div class:active={segment === "email"} class="element">
      <Link href="email">Email</Link>
    </div>
    <hr class="element" />
    <div class="element">Settings</div>
  </div>
</nav>

<style>
  :root {
    --size-nav-border: 2px;
  }
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: calc(var(--size-nav) - var(--size-nav-border));
    border-bottom: var(--size-nav-border) solid var(--color-bg-2);
  }
  .group,
  .element {
    display: flex;
    align-items: center;
    height: var(--size-nav);
  }
  .element {
    margin-left: 5px;
  }
  .group:last-child > .element:last-child {
    margin-right: 5px;
  }
  hr.element {
    padding: 0;
    margin-left: 5px;
    margin-right: 5px;
    color: var(--color-bg-2);
    height: calc(var(--size-nav) - 1px);
  }
</style>
