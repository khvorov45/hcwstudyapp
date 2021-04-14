<script lang="ts">
  import { loginReq, token, scheduleReq } from "$lib/state"
  import type {
    AsyncStatus,
    TableDisplayHeader,
    TableDisplayFilter,
  } from "$lib/util"
  import { fetchTable } from "$lib/util"
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

  const filt2: TableDisplayFilter = {
    values: 2,
    fun: (v, c) =>
      c[0] === ""
        ? v <= c[1]
        : c[1] === ""
        ? v >= c[0]
        : v <= c[1] && v >= c[0],
  }

  const headers: TableDisplayHeader<Schedule>[] = [
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
      accessor: (p) => p.year.toString(),
      width: 100,
      filter: {
        values: 1,
        fun: (v, c) => v.startsWith(c),
      },
    },
    {
      title: "Day",
      accessor: (p) => p.day.toString(),
      width: 100,
      filter: {
        values: 1,
        fun: (v, c) => v.startsWith(c),
      },
    },
    {
      title: "Date",
      accessor: (p) => p.date?.slice(0, 10) ?? "",
      width: 200,
      filter: filt2,
    },
  ]
</script>

<Table
  data={{ rows: $scheduleReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
