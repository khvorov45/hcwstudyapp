<script lang="ts">
  import { loginReq, token, participantsReq } from "$lib/state"
  import type {
    AsyncStatus,
    TableDisplayFilter,
    TableDisplayHeader,
  } from "$lib/util"
  import { fetchTable } from "$lib/util"
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

  const filt: TableDisplayFilter = {
    values: 1,
    fun: (v, c) => v.startsWith(c),
  }
  const headers: TableDisplayHeader<Participant>[] = [
    {
      title: "PID",
      accessor: (p) => p.pid,
      width: 100,
      filter: filt,
    },
    {
      title: "Email",
      accessor: (u) => u.email,
      width: 270,
      filter: filt,
    },
    {
      title: "Mobile",
      accessor: (u) => u.mobile,
      width: 130,
      filter: filt,
    },
    {
      title: "Site",
      accessor: (u) => u.site,
      width: 150,
      filter: filt,
    },
  ]
</script>

<Table
  data={{ rows: $participantsReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
