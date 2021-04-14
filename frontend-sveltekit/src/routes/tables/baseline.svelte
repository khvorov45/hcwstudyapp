<script lang="ts">
  import { loginReq, token, participantsReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterStartsWith,
    tableFilterBetween,
  } from "$lib/util"
  import { occupationToString } from "$lib/data"
  import type { Participant } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchParticipants(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(participantsReq, token, loginStatus, mounted)
  }

  $: fetchParticipants($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<Participant>[] = [
    {
      title: "PID",
      accessor: (p) => p.pid,
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Screened",
      accessor: (u) => u.date_screening?.slice(0, 10) ?? "",
      width: 230,
      filter: tableFilterBetween,
    },
    {
      title: "DoB",
      accessor: (u) => u.date_birth?.slice(0, 10) ?? "",
      width: 230,
      filter: tableFilterBetween,
    },
    {
      title: "Age at screening",
      accessor: (u) => u.age_recruitment?.toFixed(1) ?? "",
      width: 170,
      filter: tableFilterBetween,
    },
    {
      title: "Height",
      accessor: (u) => u.height?.toFixed(1) ?? "",
      width: 130,
      filter: tableFilterBetween,
    },
    {
      title: "Weight",
      accessor: (u) => u.weight?.toFixed(1) ?? "",
      width: 130,
      filter: tableFilterBetween,
    },
    {
      title: "BMI",
      accessor: (u) => u.bmi?.toFixed(1) ?? "",
      width: 130,
      filter: tableFilterBetween,
    },
    {
      title: "Gender",
      accessor: (u) => u.gender ?? "",
      width: 130,
      filter: tableFilterStartsWith,
    },
    {
      title: "Occupation",
      accessor: (u) => (u.occupation ? occupationToString(u.occupation) : ""),
      width: 130,
      filter: tableFilterStartsWith,
    },
    {
      title: "Site",
      accessor: (u) => u.site,
      width: 130,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table
  data={{ rows: $participantsReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
