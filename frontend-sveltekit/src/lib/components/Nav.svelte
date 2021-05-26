<script lang="ts">
  import { page } from "$app/stores"
  import {
    loginReq,
    theme,
    token,
    syncUsersReq,
    usersReq,
    participantsReq,
    syncParticipantsReq,
  } from "$lib/state"
  import { apiReq } from "$lib/util"
  import type { ApiResponseError, AsyncStatus } from "$lib/util"
  import Home from "./icons/Report.svelte"
  import Settings from "./icons/Settings.svelte"
  import Search from "./icons/Search.svelte"
  import Table from "./icons/Table.svelte"
  import Email from "./icons/Send.svelte"
  import Button from "./Button.svelte"
  import Popover from "./Popover.svelte"
  import Switch from "./Switch.svelte"
  import Users from "./icons/Users.svelte"
  import Attention from "./icons/Attention.svelte"

  let settingsVisible = false

  $: darkMode = $theme === "dark"

  async function syncUsers() {
    if (
      $loginReq.status !== "success" ||
      $loginReq.result?.data?.access_group !== "Admin" ||
      $token === null
    ) {
      return
    }
    await syncUsersReq.execute({ token: $token })
    await usersReq.execute({ token: $token })
  }

  async function syncParticipants() {
    if ($loginReq.status !== "success" || $token === null) {
      return
    }
    await syncParticipantsReq.execute({ token: $token })
    await participantsReq.execute({ token: $token })
  }
</script>

<nav>
  <div class="group">
    <div class="element">
      <a class:active={$page.path === "/"} href="/"><Home /></a>
    </div>
    <hr class="element" />
    {#if $loginReq.status === "success"}
      <div class="element">
        <a class:active={$page.path.startsWith("/tables")} href="/tables"
          ><Table /></a
        >
      </div>
      <div class="element">
        <a
          class:active={$page.path.startsWith("/data-quality")}
          href="/data-quality"><Attention /></a
        >
      </div>
    {/if}
  </div>

  <div class="group">
    {#if $loginReq.result?.data?.access_group === "Admin"}
      <div class="element">
        <a class:active={$page.path === "/users"} href="/users"><Users /></a>
      </div>
    {/if}
    <div class="element">
      <a class:active={$page.path === "/email"} href="/email"><Email /></a>
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
        {#if $loginReq.result?.data?.access_group === "Admin"}
          <Button
            loading={$syncUsersReq.status === "loading"}
            errorMsg={$syncUsersReq.result?.error?.message ?? ""}
            action={syncUsers}>Sync users</Button
          >
        {/if}
        {#if $loginReq.status === "success"}
          <Button
            loading={$syncParticipantsReq.status === "loading"}
            errorMsg={$syncParticipantsReq.result?.error?.message ?? ""}
            action={syncParticipants}>Sync participants</Button
          >
        {/if}
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
