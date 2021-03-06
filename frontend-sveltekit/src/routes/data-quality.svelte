<script lang="ts">
  import { loginReq, token, checkQualityReq } from "$lib/state"
  import type { AsyncStatus } from "$lib/util"
  import { fetchTable } from "$lib/util"
  import { onMount } from "svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchDataQuality(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(checkQualityReq, token, loginStatus, mounted)
  }

  $: fetchDataQuality($token, $loginReq.status, mounted)

  $: problems = $checkQualityReq.result?.data

  $: participantProblems = problems?.participant ?? null
  $: participantsOk = participantProblems?.duplicate_email.length === 0

  $: serologyProblems = problems?.serology ?? null
  $: serologyOk =
    serologyProblems?.pk.length === 0 &&
    serologyProblems?.fk_participant.length === 0 &&
    serologyProblems?.fk_virus.length == 0

  $: virusProblems = problems?.virus ?? null
  $: virusOk = virusProblems?.pk.length === 0

  $: scheduleProblems = problems?.schedule ?? null
  $: scheduleOk = scheduleProblems?.pk.length === 0

  $: weeklySurveyProblems = problems?.weekly_survey ?? null
  $: weeklySurveyOk = weeklySurveyProblems?.pk.length === 0

  $: consentProblems = problems?.consent ?? null
  $: consentOk = consentProblems?.conflicting_groups.length === 0

  $: yearChangeProblems = problems?.year_changes ?? null
  $: yearChangeOk = yearChangeProblems?.duplicate_pid.length === 0

  $: anyNull =
    participantProblems === null ||
    serologyProblems === null ||
    virusProblems === null ||
    scheduleProblems === null ||
    weeklySurveyProblems === null ||
    consentProblems === null ||
    yearChangeProblems === null

  $: allOk =
    serologyOk &&
    virusOk &&
    scheduleOk &&
    weeklySurveyOk &&
    consentOk &&
    yearChangeOk &&
    participantsOk
</script>

<div class="vscroll">
  {#if anyNull}
    ...
  {:else if allOk}
    <div class="no-problems">No problems found</div>
  {:else}
    {#if !participantsOk}
      <div class="card">
        <div class="table-name">Participants</div>
        <div class="subtitle">Duplicate email</div>
        {#each participantProblems?.duplicate_email as duplicateEmail}
          <div class="pk-problem">
            {duplicateEmail.value}: {duplicateEmail.associates.join(", ")}
          </div>
        {/each}
      </div>
    {/if}

    {#if !weeklySurveyOk}
      <div class="card">
        <div class="table-name">Weekly Survey</div>
        NOT OK
      </div>
    {/if}

    {#if !scheduleOk}
      <div class="card-container">
        <div class="card">
          <div class="table-name">Schedule</div>
          <div class="subtitle">Duplicate entries</div>
          {#each scheduleProblems?.pk as pkProblem}
            <div class="pk-problem">
              {pkProblem.value.join(" - ")}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if !virusOk}
      <div class="card">
        <div class="table-name">Virus</div>
        NOT OK
      </div>
    {/if}

    {#if !serologyOk}
      <div class="card">
        <div class="table-name">Serology</div>
        NOT OK
      </div>
    {/if}

    {#if !consentOk}
      <div class="card-container">
        <div class="card">
          <div class="table-name">Consent</div>
          <div class="subtitle">Conflicting forms</div>
          {#each consentProblems?.conflicting_groups as conflict}
            <div>{conflict.join(" ")}</div>
          {/each}
        </div>
      </div>
    {/if}

    {#if !yearChangeOk}
      <div class="card-container">
        <div class="card">
          <div class="table-name">Year changes</div>
          <div class="subtitle">Duplicate pids</div>
          {#each yearChangeProblems?.duplicate_pid as duplicatePid}
            <div>
              {duplicatePid.value.join(" ")}: {duplicatePid.rows.join(" ")}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .vscroll {
    height: calc(100vh - var(--size-nav));
    overflow-y: scroll;
    overflow-x: hidden;
    display: flex;
  }
  .card-container {
    display: flex;
    margin-top: 10px;
    margin-left: 10px;
  }
  .card {
    display: flex;
    flex-direction: column;
  }
  .table-name {
    font-size: large;
    text-align: center;
  }
  .subtitle {
    text-align: center;
    color: var(--color-font-2);
  }
</style>
