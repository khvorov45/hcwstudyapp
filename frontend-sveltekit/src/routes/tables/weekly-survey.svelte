<script lang="ts">
  import { loginReq, token, weeklySurveyReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterStartsWith,
    tableFilterBetween,
    tableFilterIncludes,
  } from "$lib/util"
  import { swabResultToString } from "$lib/data"
  import type { WeeklySurvey } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchThisTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(weeklySurveyReq, token, loginStatus, mounted)
  }

  $: fetchThisTable($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<WeeklySurvey>[] = [
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
      title: "Index",
      accessor: (p) => p.index.toString(),
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Date",
      accessor: (p) => p.date.slice(0, 10) ?? "",
      width: 200,
      filter: tableFilterBetween,
    },
    {
      title: "ARI",
      accessor: (p) => p.ari?.toString() ?? "",
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Swabbed",
      accessor: (p) => p.swab_collection?.toString() ?? "",
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Result",
      accessor: (p) => p.swab_result.map(swabResultToString).join(" "),
      width: 100,
      filter: tableFilterIncludes,
    },
  ]
</script>

<Table
  data={{ rows: $weeklySurveyReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
