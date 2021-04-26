<script lang="ts">
  import { loginReq, token, virusReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterBetween,
    tableFilterStartsWith,
    tableFilterIncludes,
  } from "$lib/util"
  import type { Virus } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchThisTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(virusReq, token, loginStatus, mounted)
  }

  $: fetchThisTable($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<Virus>[] = [
    {
      title: "Name",
      accessor: (p) => p.name,
      width: 300,
      filter: tableFilterIncludes,
    },
    {
      title: "Short name",
      accessor: (p) => p.short_name,
      width: 200,
      filter: tableFilterIncludes,
    },
    {
      title: "Clade",
      accessor: (p) => p.clade,
      width: 100,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table
  data={{ rows: $virusReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
