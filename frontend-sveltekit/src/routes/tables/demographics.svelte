<script lang="ts">
  import {
    loginReq,
    token,
    participantsReq,
    scrollbarWidth,
    vaccinationHistoryReq,
    participantsExtra,
    participantsSummary,
  } from "$lib/state"
  import type { AsyncStatus } from "$lib/util"
  import { fetchTable, FetchTableStatus } from "$lib/util"
  import type { Site, Gender, Occupation } from "$lib/data"
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
      fetchTable(vaccinationHistoryReq, token, loginStatus, mounted),
    ])
    if (statuses.find((s) => s === FetchTableStatus.Fetched) !== undefined) {
      needToRegenExtra = true
    }
  }

  let needToRegenSummary = false
  function regenExtra(need: boolean) {
    if (!need && $participantsExtra.init) {
      return
    }
    needToRegenExtra = false
    needToRegenSummary = true
    const participants = $participantsReq.result?.data ?? []
    const vaccinations = $vaccinationHistoryReq.result?.data ?? []
    participantsExtra.gen({ participants, vaccinations })
  }

  function regenSummary(need: boolean) {
    if (!need && $participantsSummary.init) {
      return
    }
    needToRegenSummary = false
    participantsSummary.gen($participantsExtra.result)
  }

  let priorVacs = [0, 1, 2, 3, 4, 5]
  let sites: Site[] = [
    "Adelaide",
    "Brisbane",
    "Melbourne",
    "Newcastle",
    "Perth",
    "Sydney",
  ]
  let genders: Gender[] = ["Female", "Male", "Other"]
  let occupations = [
    "Administrative",
    "AlliedHealth",
    "Ancillary",
    "Laboratory",
    "Medical",
    "Nursing",
    "Research",
    "Other",
  ]

  let split: "Site" | "PriorVacs" = "PriorVacs"

  $: fetchTables($token, $loginReq.status, mounted)
  $: regenExtra(needToRegenExtra)
  $: regenSummary(needToRegenSummary)
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
      <div class="tr header-row overhead">
        <div class="th">
          {#if split === "Site"}
            Site
          {:else}
            Vaccinations (5 years before screening)
          {/if}
        </div>
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
      <!--Overall counts-->
      <div class="tr data-row start-row">
        <div class="td">Count</div>
        {#if split === "Site"}
          {#each sites as site}
            <div class="td">
              {$participantsSummary.result?.site.find((r) => r.site == site)
                ?.count.n ?? 0}
            </div>
          {/each}
        {:else}
          {#each priorVacs as priorVac}
            <div class="td">
              {$participantsSummary.result?.priorVacs5YearBeforeScreening.find(
                (r) => r.priorVacs5YearBeforeScreening == priorVac
              )?.count.n ?? 0}
            </div>
          {/each}
        {/if}
        <div class="td">
          {$participantsSummary.result?.overall[0]?.count.n ?? ""}
        </div>
      </div>
      <!--Site-prior vac counts-->
      {#if split === "Site"}
        {#each priorVacs as priorVac}
          <div class="tr">
            <div class="td">{priorVac + " prior"}</div>
            {#each sites as site}
              <div class="td">
                {$participantsSummary.result?.sitePriorVacCounts.find(
                  (x) =>
                    x.site === site &&
                    x.priorVacs5YearBeforeScreening == priorVac
                )?.n ?? 0}
              </div>
            {/each}
            <div class="td">
              {$participantsSummary.result?.priorVacs5YearBeforeScreening.find(
                (r) => r.priorVacs5YearBeforeScreening == priorVac
              )?.count.n ?? 0}
            </div>
          </div>
        {/each}
      {:else}
        {#each sites as site}
          <div class="tr">
            <div class="td">{site}</div>
            {#each priorVacs as priorVac}
              <div class="td">
                {$participantsSummary.result?.sitePriorVacCounts.find(
                  (x) =>
                    x.site === site &&
                    x.priorVacs5YearBeforeScreening == priorVac
                )?.n ?? 0}
              </div>
            {/each}
            <div class="td">
              {$participantsSummary.result?.site.find((r) => r.site == site)
                ?.count.n ?? 0}
            </div>
          </div>
        {/each}
      {/if}
      <!--Gender counts-->
      <div class="tr label-row start-row">
        <div class="td">Gender</div>
      </div>
      {#each genders as gender}
        <div class="tr data-row">
          <div class="td">{gender}</div>
          {#if split === "Site"}
            {#each sites as site}
              <div class="td">
                {$participantsSummary.result?.site
                  .find((r) => r.site == site)
                  ?.gender.find((x) => x.gender === gender)?.n ?? 0}
              </div>
            {/each}
          {:else}
            {#each priorVacs as priorVac}
              <div class="td">
                {$participantsSummary.result?.priorVacs5YearBeforeScreening
                  .find((r) => r.priorVacs5YearBeforeScreening == priorVac)
                  ?.gender.find((x) => x.gender === gender)?.n ?? 0}
              </div>
            {/each}
          {/if}
          <div class="td">
            {$participantsSummary.result?.overall[0]?.gender.find(
              (x) => x.gender === gender
            )?.n ?? 0}
          </div>
        </div>
      {/each}
      <!--Occupation counts-->
      <div class="tr label-row start-row">
        <div class="td">Occupation</div>
      </div>
      {#each occupations as occupation}
        <div class="tr data-row">
          <div class="td">{occupation}</div>
          {#if split === "Site"}
            {#each sites as site}
              <div class="td">
                {$participantsSummary.result?.site
                  .find((r) => r.site == site)
                  ?.occupation.find((x) => x.occupation === occupation)?.n ?? 0}
              </div>
            {/each}
          {:else}
            {#each priorVacs as priorVac}
              <div class="td">
                {$participantsSummary.result?.priorVacs5YearBeforeScreening
                  .find((r) => r.priorVacs5YearBeforeScreening == priorVac)
                  ?.occupation.find((x) => x.occupation === occupation)?.n ?? 0}
              </div>
            {/each}
          {/if}
          <div class="td">
            {$participantsSummary.result?.overall[0]?.occupation.find(
              (x) => x.occupation === occupation
            )?.n ?? 0}
          </div>
        </div>
      {/each}
      <!--Age summaries-->
      <div class="tr start-row">
        <div class="td">
          <span>Age</span><Summary
            summary={{ mean: "median", low: "min", high: "max" }}
          />
        </div>
        {#if split === "Site"}
          {#each sites as site}
            <div class="td">
              <Summary
                summary={$participantsSummary.result?.site.find(
                  (r) => r.site == site
                )?.age ?? null}
                format={(s) => s.toFixed(0)}
              />
            </div>
          {/each}
        {:else}
          {#each priorVacs as priorVac}
            <div class="td">
              <Summary
                summary={$participantsSummary.result?.priorVacs5YearBeforeScreening.find(
                  (r) => r.priorVacs5YearBeforeScreening == priorVac
                )?.age ?? null}
                format={(s) => s.toFixed(0)}
              />
            </div>
          {/each}
        {/if}
        <div class="td">
          <Summary
            summary={$participantsSummary.result?.overall[0]?.age ?? null}
            format={(s) => s.toFixed(0)}
          />
        </div>
      </div>
      <!--Height summaries-->
      <div class="tr start-row">
        <div class="td">
          <span>Height</span><Summary
            summary={{ mean: "median", low: "min", high: "max" }}
          />
        </div>
        {#if split === "Site"}
          {#each sites as site}
            <div class="td">
              <Summary
                summary={$participantsSummary.result?.site.find(
                  (r) => r.site == site
                )?.height ?? null}
                format={(s) => s.toFixed(0)}
              />
            </div>
          {/each}
        {:else}
          {#each priorVacs as priorVac}
            <div class="td">
              <Summary
                summary={$participantsSummary.result?.priorVacs5YearBeforeScreening.find(
                  (r) => r.priorVacs5YearBeforeScreening == priorVac
                )?.height ?? null}
                format={(s) => s.toFixed(0)}
              />
            </div>
          {/each}
        {/if}
        <div class="td">
          <Summary
            summary={$participantsSummary.result?.overall[0]?.height ?? null}
            format={(s) => s.toFixed(0)}
          />
        </div>
      </div>
      <!--Weight summaries-->
      <div class="tr start-row">
        <div class="td">
          <span>Weight</span><Summary
            summary={{ mean: "median", low: "min", high: "max" }}
          />
        </div>
        {#if split === "Site"}
          {#each sites as site}
            <div class="td">
              <Summary
                summary={$participantsSummary.result?.site.find(
                  (r) => r.site == site
                )?.weight ?? null}
                format={(s) => s.toFixed(0)}
              />
            </div>
          {/each}
        {:else}
          {#each priorVacs as priorVac}
            <div class="td">
              <Summary
                summary={$participantsSummary.result?.priorVacs5YearBeforeScreening.find(
                  (r) => r.priorVacs5YearBeforeScreening == priorVac
                )?.weight ?? null}
                format={(s) => s.toFixed(0)}
              />
            </div>
          {/each}
        {/if}
        <div class="td">
          <Summary
            summary={$participantsSummary.result?.overall[0]?.weight ?? null}
            format={(s) => s.toFixed(0)}
          />
        </div>
      </div>
      <!--BMI summaries-->
      <div class="tr start-row">
        <div class="td">
          <span>BMI</span><Summary
            summary={{ mean: "median", low: "min", high: "max" }}
          />
        </div>
        {#if split === "Site"}
          {#each sites as site}
            <div class="td">
              <Summary
                summary={$participantsSummary.result?.site.find(
                  (r) => r.site == site
                )?.bmi ?? null}
                format={(s) => s.toFixed(1)}
              />
            </div>
          {/each}
        {:else}
          {#each priorVacs as priorVac}
            <div class="td">
              <Summary
                summary={$participantsSummary.result?.priorVacs5YearBeforeScreening.find(
                  (r) => r.priorVacs5YearBeforeScreening == priorVac
                )?.bmi ?? null}
                format={(s) => s.toFixed(1)}
              />
            </div>
          {/each}
        {/if}
        <div class="td">
          <Summary
            summary={$participantsSummary.result?.overall[0]?.bmi ?? null}
            format={(s) => s.toFixed(1)}
          />
        </div>
      </div>
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
    width: calc(8 * 100px + var(--scrollbar-width));
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
    width: 100px;
  }
  .overhead .th {
    width: calc(8 * 100px + var(--scrollbar-width));
  }
  .label-row {
    background-color: var(--color-bg-2);
  }
  .header-row {
    height: var(--height-header-summary);
  }
  .start-row {
    border-top: 1px solid var(--color-bg-3);
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
