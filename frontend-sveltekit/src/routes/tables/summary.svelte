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
  } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterStartsWith,
    tableFilterIncludes,
    FetchTableStatus,
  } from "$lib/util"
  import type { Serology, Site } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"
  import Summary from "$lib/components/Summary.svelte"

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
    ])
    if (statuses.find((s) => s === FetchTableStatus.Fetched) !== undefined) {
      needToRegenExtra = true
    }
  }

  let needToRegenSummary = false
  function regenExtra(need: boolean) {
    if (!need && $serologyExtra.init) {
      return
    }
    needToRegenExtra = false
    needToRegenSummary = true
    const serology = $serologyReq.result?.data ?? []
    const particpants = $participantsReq.result?.data ?? []
    serologyExtra.gen({ serology, particpants })
  }

  function regenSummary(need: boolean) {
    if (!need && $serologySummary.init) {
      return
    }
    needToRegenSummary = false
    serologySummary.gen($serologyExtra.result)
  }

  let days = [0, 7, 14, 220]
  let sites: Site[] = [
    "Adelaide",
    "Brisbane",
    "Melbourne",
    "Newcastle",
    "Perth",
    "Sydney",
  ]

  $: fetchTables($token, $loginReq.status, mounted)
  $: regenExtra(needToRegenExtra)
  $: regenSummary(needToRegenSummary)

  $: viruses = $virusReq.result?.data?.map((v) => v.name) ?? []
</script>

<div class="table-container" style="--scrollbar-width: {$scrollbarWidth}px;">
  <div class="table">
    <div class="thead">
      <div class="tr header-row">
        <div class="th" />
        {#each sites as site}
          <div class="th">{site}</div>
        {/each}
        <div class="th">Overall</div>
      </div>
    </div>
    <div class="tbody">
      <div class="tr label-row"><div class="td label-data">GMT</div></div>
      {#each viruses as virus}
        <div class="tr label-row"><div class="td">{virus}</div></div>
        {#each days as day}
          <div class="tr data-row">
            <div class="td">{day}</div>
            {#each sites as site}
              <div class="td">
                <Summary
                  summary={$serologySummary.site.find(
                    (s) =>
                      s.day === day &&
                      s.virus === virus &&
                      s.year === 2020 &&
                      s.site == site
                  ) ?? null}
                />
              </div>
            {/each}
            <div class="td">
              <Summary
                summary={$serologySummary.overall.find(
                  (s) => s.day === day && s.virus === virus && s.year === 2020
                ) ?? null}
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
    --height-row: 45px;
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
      100vh - var(--size-nav) * 2 - var(--height-row) - var(--scrollbar-width)
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
