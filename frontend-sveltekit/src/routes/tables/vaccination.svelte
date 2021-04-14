<script lang="ts">
  import { loginReq, token, vaccinationHistoryReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import { fetchTable, tableFilterStartsWith } from "$lib/util"
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
      filter: tableFilterStartsWith,
    },
    {
      title: "Year",
      accessor: (p) => p.year.toString(),
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Status",
      accessor: (p) => p.status ?? "",
      width: 100,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table
  data={{ rows: $vaccinationHistoryReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
