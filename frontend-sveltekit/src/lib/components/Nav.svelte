<script lang="ts">
  import { page } from "$app/stores"
  import { loginStatus, theme } from "$lib/state"
  import Home from "./icons/Report.svelte"
  import Settings from "./icons/Settings.svelte"
  import Search from "./icons/Search.svelte"
  import Table from "./icons/Table.svelte"
  import Email from "./icons/Send.svelte"
  import Button from "./Button.svelte"
  import Popover from "./Popover.svelte"
  import Switch from "./Switch.svelte"
  import Users from "./icons/Users.svelte"

  let settingsVisible = false

  $: darkMode = $theme === "dark"
</script>

<nav>
  <div class="group">
    <div class="element">
      <a class:active={$page.path === "/"} href="/"><Home /></a>
    </div>
    <hr class="element" />
    {#if $loginStatus.status === "success"}
      <div class="element">
        <a class:active={$page.path === "/tables"} href="tables"><Table /></a>
      </div>
    {/if}
  </div>

  <div class="group">
    <div class="element">
      <a class:active={$page.path === "/users"} href="users"><Users /></a>
    </div>
    <div class="element">
      <a class:active={$page.path === "/email"} href="email"><Email /></a>
    </div>
    <div class="element">
      <a class:active={$page.path === "/search"} href="/search"><Search /></a>
    </div>
    <hr class="element" />
    <div class="element">
      <Button variant="icon" action={() => (settingsVisible = !settingsVisible)}
        ><Settings /></Button
      ><Popover
        bind:visible={settingsVisible}
        left="-147px"
        top="calc(var(--size-nav) / 2)"
      >
        <Button
          width="140px"
          action={() => ($theme = $theme === "dark" ? "light" : "dark")}
          ><Switch checked={darkMode}>Dark mode</Switch></Button
        >
      </Popover>
    </div>
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
    transition: border-color var(--time-transition);
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
  a {
    display: flex;
    align-items: center;
    height: calc(var(--size-nav) - var(--size-nav-border));
    border-bottom: var(--size-nav-border) solid rgba(0, 0, 0, 0);
    transition: border-bottom var(--time-transition);
  }
  a:hover,
  a:focus {
    border-bottom: var(--size-nav-border) solid var(--color-primary-3);
  }
  a.active {
    border-bottom: var(--size-nav-border) solid var(--color-primary-3);
  }
</style>
