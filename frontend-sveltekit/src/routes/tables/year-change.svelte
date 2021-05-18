<script lang="ts">
  import { loginReq, token, yearChangeReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import { fetchTable, tableFilterStartsWith } from "$lib/util"
  import type { YearChange } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchThisTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(yearChangeReq, token, loginStatus, mounted)
  }

  $: fetchThisTable($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<YearChange>[] = [
    {
      title: "Record ID",
      accessor: (p) => p.record_id,
      width: 120,
      filter: tableFilterStartsWith,
    },
    {
      title: "Year",
      accessor: (p) => p.year.toString(),
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "PID",
      accessor: (p) => p.pid ?? "",
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "PID (pre-format)",
      accessor: (p) => p.pid_preformat ?? "",
      width: 150,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table
  data={{ rows: $yearChangeReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
