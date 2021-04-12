<script lang="ts">
  import { loginReq, token, participantsReq } from "$lib/state"
  import type {
    AsyncStatus,
    TableDisplayFilter,
    TableDisplayHeader,
  } from "$lib/util"
  import { fetchTable, justDateString } from "$lib/util"
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

  const filt2: TableDisplayFilter = {
    values: 2,
    fun: (v, c) =>
      c[0] === ""
        ? v <= c[1]
        : c[1] === ""
        ? v >= c[0]
        : v <= c[1] && v >= c[0],
  }

  const headers: TableDisplayHeader<Participant>[] = [
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
      title: "Screened",
      accessor: (u) => u.date_screening?.slice(0, 10) ?? "",
      width: 270,
      filter: filt2,
    },
    {
      title: "DoB",
      accessor: (u) => u.date_birth?.slice(0, 10) ?? "",
      width: 270,
      filter: filt2,
    },
  ]
</script>

<Table
  data={{ rows: $participantsReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
