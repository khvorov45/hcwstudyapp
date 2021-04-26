<script lang="ts">
  import {
    loginReq,
    token,
    serologyReq,
    participantsReq,
    serologyExtra,
    serologySummary,
    virusReq,
  } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterStartsWith,
    tableFilterIncludes,
    FetchTableStatus,
  } from "$lib/util"
  import type { Serology } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

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

  $: fetchTables($token, $loginReq.status, mounted)
  $: regenExtra(needToRegenExtra)
  $: regenSummary(needToRegenSummary)

  $: viruses = $virusReq.result?.data?.map((v) => v.name) ?? []

  $: console.log($serologyExtra)
  $: console.log($serologySummary)
</script>

<div class="table">
  <div class="thead">
    <div class="tr header-row">
      <div class="th" />
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
          <div class="td">
            {$serologySummary.overall
              .find(
                (s) => s.day === day && s.virus === virus && s.year === 2020
              )
              ?.mean.toFixed(0) ?? ""}
          </div>
        </div>
      {/each}
    {/each}
  </div>
</div>

<style>
  :root {
    --height-row: 30px;
  }
  .tbody {
    height: calc(100vh - var(--size-nav) * 2 - var(--height-row));
    overflow-y: scroll;
    overflow-x: hidden;
  }
  .tr {
    display: flex;
    height: 30px;
  }
  .tr :nth-child(1) {
    width: 300px;
  }
</style>
