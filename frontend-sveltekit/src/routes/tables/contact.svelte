<script lang="ts">
  import { loginReq, token, participantsReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterStartsWith,
    tableFilterIncludes,
  } from "$lib/util"
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

  //$: console.log($participantsReq.result)

  const headers: TableDisplayHeader<Participant, String>[] = [
    {
      title: "PID",
      accessor: (p) => p.pid,
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Email",
      accessor: (u) => u.email ?? "",
      width: 270,
      filter: tableFilterIncludes,
    },
    {
      title: "Mobile",
      accessor: (u) => u.mobile ?? "",
      width: 130,
      filter: tableFilterStartsWith,
    },
    {
      title: "Site",
      accessor: (u) => u.site,
      width: 150,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table
  data={{ rows: $participantsReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
