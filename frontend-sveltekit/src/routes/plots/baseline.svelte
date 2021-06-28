<script lang="ts">
  import type { ParticipantExtra } from "$lib/state"
  import {
    loginReq,
    token,
    participantsReq,
    vaccinationHistoryReq,
    bleedReq,
    participantsExtra,
    participantsSummary,
  } from "$lib/state"
  import type { AsyncStatus } from "$lib/util"
  import { fetchTable, genericSort } from "$lib/util"
  import type { VaccinationHistory, Participant } from "$lib/data"
  import { onMount } from "svelte"
  import BarPlot from "$lib/components/plot/BarPlot.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchTables(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await Promise.all([
      fetchTable(participantsReq, token, loginStatus, mounted),
      fetchTable(vaccinationHistoryReq, token, loginStatus, mounted),
      fetchTable(bleedReq, token, loginStatus, mounted),
    ])
  }

  function regenExtra(
    participants: Participant[],
    vaccinations: VaccinationHistory[]
  ) {
    participantsExtra.gen({ participants, vaccinations })
  }

  function regenFilter(
    participantsExtra: ParticipantExtra[],
    recruitmentYear: number | null,
    pidsWithBleeds: string[],
    currentlyActive: boolean | null
  ) {
    if (recruitmentYear === null && currentlyActive === null) {
      return participantsExtra
    }
    return participantsExtra.filter(
      (x) =>
        (recruitmentYear
          ? new Date(x.date_screening).getFullYear() === recruitmentYear
          : true) &&
        (currentlyActive === null
          ? true
          : currentlyActive
          ? pidsWithBleeds.includes(x.pid)
          : !pidsWithBleeds.includes(x.pid))
    )
  }

  function regenSummary(participantsExtraFiltered: ParticipantExtra[]) {
    participantsSummary.gen(participantsExtraFiltered ?? [])
  }

  let recruitmentYear = null
  let currentlyActive = null

  const thisYear = new Date().getFullYear()

  $: fetchTables($token, $loginReq.status, mounted)
  $: regenExtra(
    $participantsReq.result?.data ?? [],
    $vaccinationHistoryReq.result?.data ?? []
  )
  $: pidsWithBleeds = $bleedReq.result?.data
    ?.filter((p) => p.date !== null && p.year == thisYear)
    .map((p) => p.pid)
  $: participantsExtraFiltered = regenFilter(
    $participantsExtra.result ?? [],
    recruitmentYear,
    pidsWithBleeds,
    currentlyActive ? currentlyActive === "yes" : null
  )
  $: regenSummary(participantsExtraFiltered)

  $: data = $participantsSummary.result?.priorVacs5YearBeforeScreening ?? []

  $: dataSorted = data.sort(genericSort((x) => x.priorVacs5YearBeforeScreening))
  $: dataX = dataSorted.map((x) => x.priorVacs5YearBeforeScreening)
</script>

<BarPlot
  {dataX}
  xLab="Known prior vaccinations in past 5 years"
  dataY={dataSorted.map((x) => x.count.n)}
  yTicks={[0, 100, 200, 300, 400, 500, 600, 700]}
  yLims={[0, 700]}
/>
