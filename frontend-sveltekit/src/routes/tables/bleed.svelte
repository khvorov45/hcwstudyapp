<script lang="ts">
  import { loginReq, token, bleedReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import { fetchTable, tableFilterStartsWith } from "$lib/util"
  import type { Bleed } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchThisTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(bleedReq, token, loginStatus, mounted)
  }

  $: fetchThisTable($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<Bleed, string>[] = [
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
      width: 100,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table
  data={{ rows: $bleedReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
