<script lang="ts">
  import { loginReq, token, scheduleReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterBetween,
    tableFilterStartsWith,
  } from "$lib/util"
  import type { Schedule } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchSchedule(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(scheduleReq, token, loginStatus, mounted)
  }

  $: fetchSchedule($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<Schedule>[] = [
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
      title: "Day",
      accessor: (p) => p.day.toString(),
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Date",
      accessor: (p) => p.date?.slice(0, 10) ?? "",
      width: 200,
      filter: tableFilterBetween,
    },
  ]
</script>

<Table
  data={{ rows: $scheduleReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
