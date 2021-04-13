<script lang="ts">
  import { loginReq, token, vaccinationHistoryReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import { fetchTable } from "$lib/util"
  import type { VaccinationHistory } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchVaccination(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(vaccinationHistoryReq, token, loginStatus, mounted)
  }

  $: fetchVaccination($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<VaccinationHistory>[] = [
    {
      title: "PID",
      accessor: (p) => p.pid,
      width: 100,
      filter: {
        values: 1,
        fun: (v, c) => v.startsWith(c),
      },
    },
    {
      title: "Year",
      accessor: (p) => p.year,
      width: 100,
      filter: {
        values: 1,
        fun: (v, c) => v.startsWith(c),
      },
    },
    {
      title: "Status",
      accessor: (p) => p.status ?? "",
      width: 100,
      filter: {
        values: 1,
        fun: (v, c) => v.startsWith(c),
      },
    },
  ]
</script>

<Table
  data={{ rows: $vaccinationHistoryReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
