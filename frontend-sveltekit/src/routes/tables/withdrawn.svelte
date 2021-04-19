<script lang="ts">
  import { loginReq, token, withdrawnReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterBetween,
    tableFilterStartsWith,
    tableFilterIncludes,
  } from "$lib/util"
  import type { Withdrawn } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchThisTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(withdrawnReq, token, loginStatus, mounted)
  }

  $: fetchThisTable($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<Withdrawn>[] = [
    {
      title: "PID",
      accessor: (p) => p.pid,
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Date",
      accessor: (p) => p.date?.slice(0, 10) ?? "",
      width: 200,
      filter: tableFilterBetween,
    },
    {
      title: "Reason",
      accessor: (p) => p.reason ?? "",
      width: 400,
      filter: tableFilterIncludes,
    },
  ]
</script>

<Table
  data={{ rows: $withdrawnReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
  heightDataCell="90px"
/>
