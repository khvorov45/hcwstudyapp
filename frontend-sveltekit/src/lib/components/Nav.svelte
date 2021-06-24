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
    syncVaccinationReq,
    vaccinationHistoryReq,
    syncScheduleReq,
    scheduleReq,
    syncWeeklySurveyReq,
    weeklySurveyReq,
    syncWithdrawnReq,
    withdrawnReq,
    syncConsentReq,
    consentReq,
    syncYearChangeReq,
    yearChangeReq,
    syncBleedReq,
    bleedReq,
  } from "$lib/state"
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
  import Chart from "./icons/Chart.svelte"

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

  async function syncVaccination() {
    if ($loginReq.status !== "success" || $token === null) {
      return
    }
    await syncVaccinationReq.execute({ token: $token })
    await vaccinationHistoryReq.execute({ token: $token })
  }
  async function syncSchedule() {
    if ($loginReq.status !== "success" || $token === null) {
      return
    }
    await syncScheduleReq.execute({ token: $token })
    await scheduleReq.execute({ token: $token })
  }
  async function syncBleed() {
    if ($loginReq.status !== "success" || $token === null) {
      return
    }
    await syncBleedReq.execute({ token: $token })
    await bleedReq.execute({ token: $token })
  }
  async function syncWeeklySurvey() {
    if ($loginReq.status !== "success" || $token === null) {
      return
    }
    await syncWeeklySurveyReq.execute({ token: $token })
    await weeklySurveyReq.execute({ token: $token })
  }
  async function syncWithdrawn() {
    if ($loginReq.status !== "success" || $token === null) {
      return
    }
    await syncWithdrawnReq.execute({ token: $token })
    await withdrawnReq.execute({ token: $token })
  }
  async function syncConsent() {
    if ($loginReq.status !== "success" || $token === null) {
      return
    }
    await syncConsentReq.execute({ token: $token })
    await consentReq.execute({ token: $token })
  }

  async function syncYearChange() {
    if ($loginReq.status !== "success" || $token === null) {
      return
    }
    await syncYearChangeReq.execute({ token: $token })
    await yearChangeReq.execute({ token: $token })
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
        <a class:active={$page.path.startsWith("/plots")} href="/plots"
          ><Chart /></a
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
          <Button
            loading={$syncVaccinationReq.status === "loading"}
            errorMsg={$syncVaccinationReq.result?.error?.message ?? ""}
            action={syncVaccination}>Sync vaccination</Button
          >
          <Button
            loading={$syncScheduleReq.status === "loading"}
            errorMsg={$syncScheduleReq.result?.error?.message ?? ""}
            action={syncSchedule}>Sync schedule</Button
          >
          <Button
            loading={$syncBleedReq.status === "loading"}
            errorMsg={$syncBleedReq.result?.error?.message ?? ""}
            action={syncBleed}>Sync bleed</Button
          >
          <Button
            loading={$syncWeeklySurveyReq.status === "loading"}
            errorMsg={$syncWeeklySurveyReq.result?.error?.message ?? ""}
            action={syncWeeklySurvey}>Sync weekly surveys</Button
          >
          <Button
            loading={$syncWithdrawnReq.status === "loading"}
            errorMsg={$syncWithdrawnReq.result?.error?.message ?? ""}
            action={syncWithdrawn}>Sync withdrawn</Button
          >
          <Button
            loading={$syncConsentReq.status === "loading"}
            errorMsg={$syncConsentReq.result?.error?.message ?? ""}
            action={syncConsent}>Sync consent</Button
          >
          <Button
            loading={$syncYearChangeReq.status === "loading"}
            errorMsg={$syncYearChangeReq.result?.error?.message ?? ""}
            action={syncYearChange}>Sync year-change</Button
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
