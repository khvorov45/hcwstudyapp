<script lang="ts">
  import { loginReq, token, serologyReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterBetween,
    tableFilterStartsWith,
    tableFilterIncludes,
  } from "$lib/util"
  import type { Serology } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchThisTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(serologyReq, token, loginStatus, mounted)
  }

  $: fetchThisTable($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<Serology>[] = [
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
      title: "Virus",
      accessor: (p) => p.virus,
      width: 300,
      filter: tableFilterIncludes,
    },
    {
      title: "Titre",
      accessor: (p) => p.titre.toString(),
      width: 100,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table
  data={{ rows: $serologyReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
