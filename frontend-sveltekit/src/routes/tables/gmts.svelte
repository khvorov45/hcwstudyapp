<script lang="ts">
  import {
    loginReq,
    token,
    serologyReq,
    participantsReq,
    serologyExtra,
    serologySummary,
    virusReq,
    scrollbarWidth,
    vaccinationHistoryReq,
    participantsExtra,
  } from "$lib/state"
  import type { AsyncStatus } from "$lib/util"
  import { fetchTable, FetchTableStatus } from "$lib/util"
  import type { Site } from "$lib/data"
  import { onMount } from "svelte"
  import Summary from "$lib/components/Summary.svelte"
  import Button from "$lib/components/Button.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  let needToRegenExtra = false
  async function fetchTables(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    const statuses = await Promise.all([
      fetchTable(participantsReq, token, loginStatus, mounted),
      fetchTable(serologyReq, token, loginStatus, mounted),
      fetchTable(virusReq, token, loginStatus, mounted),
      fetchTable(vaccinationHistoryReq, token, loginStatus, mounted),
    ])
    if (statuses.find((s) => s === FetchTableStatus.Fetched) !== undefined) {
      needToRegenExtra = true
    }
  }

  let needToRegenSummary = false
  function regenExtra(need: boolean) {
    if (!need && $serologyExtra.init && $participantsExtra.init) {
      return
    }
    needToRegenExtra = false
    needToRegenSummary = true
    const serology = $serologyReq.result?.data ?? []
    const participants = $participantsReq.result?.data ?? []
    const vaccinations = $vaccinationHistoryReq.result?.data ?? []
    participantsExtra.gen({ participants, vaccinations })
    serologyExtra.gen({ serology, participants: $participantsExtra.result })
  }

  function regenSummary(need: boolean) {
    if (!need && $serologySummary.init) {
      return
    }
    needToRegenSummary = false
    serologySummary.gen($serologyExtra.result)
  }

  let days = [0, 7, 14, 220]
  let priorVacs = [0, 1, 2, 3, 4, 5]
  let sites: Site[] = [
    "Adelaide",
    "Brisbane",
    "Melbourne",
    "Newcastle",
    "Perth",
    "Sydney",
  ]

  let split: "Site" | "PriorVacs" = "PriorVacs"

  $: fetchTables($token, $loginReq.status, mounted)
  $: regenExtra(needToRegenExtra)
  $: regenSummary(needToRegenSummary)

  $: viruses = $virusReq.result?.data?.map((v) => v.name) ?? []
</script>

<div class="control">
  <Button
    action={() => (split === "Site" ? (split = "PriorVacs") : (split = "Site"))}
    height="calc(var(--size-nav) - 1px)"
    width="150px"
    >Split: {split === "PriorVacs" ? "Vaccinations" : "Site"}</Button
  >
</div>

<div class="table-container" style="--scrollbar-width: {$scrollbarWidth}px;">
  <div class="table">
    <div class="thead">
      <div class="tr header-row">
        <div class="th" />
        <div class="th">
          {#if split === "Site"}
            Site
          {:else}
            Vaccinations (5 years before bleed)
          {/if}
        </div>
        <div class="th" />
      </div>
      <div class="tr header-row">
        <div class="th" />
        {#if split === "Site"}
          {#each sites as site}
            <div class="th">{site}</div>
          {/each}
        {:else}
          {#each priorVacs as priorVac}
            <div class="th">{priorVac}</div>
          {/each}
        {/if}
        <div class="th">Overall</div>
      </div>
    </div>
    <div class="tbody">
      {#each viruses as virus}
        <div class="tr label-row"><div class="td">{virus}</div></div>
        {#each days as day}
          <div class="tr data-row">
            <div class="td">{day}</div>
            {#if split === "Site"}
              {#each sites as site}
                <div class="td">
                  <Summary
                    summary={$serologySummary.result?.site.find(
                      (s) =>
                        s.day === day &&
                        s.virus === virus &&
                        s.year === 2020 &&
                        s.site == site
                    ) ?? null}
                    format={(s) => s.toFixed(0)}
                  />
                </div>
              {/each}
            {:else}
              {#each priorVacs as priorVac}
                <div class="td">
                  <Summary
                    summary={$serologySummary.result?.priorVacs5YearBeforeBleed.find(
                      (s) =>
                        s.day === day &&
                        s.virus === virus &&
                        s.year === 2020 &&
                        s.priorVacs5YearBeforeBleed == priorVac
                    ) ?? null}
                    format={(s) => s.toFixed(0)}
                  />
                </div>
              {/each}
            {/if}
            <div class="td">
              <Summary
                summary={$serologySummary.result?.overall.find(
                  (s) => s.day === day && s.virus === virus && s.year === 2020
                ) ?? null}
                format={(s) => s.toFixed(0)}
              />
            </div>
          </div>
        {/each}
      {/each}
    </div>
  </div>
</div>

<style>
  :root {
    --height-header-summary: 30px;
    --height-row: 45px;
  }
  .control {
    display: flex;
    height: var(--size-nav);
    border-bottom: 1px solid var(--color-bg-2);
    box-sizing: border-box;
  }
  .table-container {
    width: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
  }
  .table {
    width: calc(8 * 100px);
    margin-left: auto;
    margin-right: auto;
  }
  .tbody {
    height: calc(
      100vh - var(--size-nav) * 3 - var(--height-header-summary) * 2 -
        var(--scrollbar-width)
    );
    overflow-y: scroll;
    overflow-x: hidden;
  }
  .tr {
    display: flex;
    height: var(--height-row);
  }
  .tr * {
    width: 300px;
  }
  .label-row {
    background-color: var(--color-bg-2);
  }
  .header-row {
    height: var(--height-header-summary);
  }
  .td,
  .th {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .th {
    font-weight: bold;
  }
  .label-row .td {
    justify-content: flex-start;
  }
</style>
