<script lang="ts">
  import { loginReq, token, participantsReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
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

  const headers: TableDisplayHeader<Participant>[] = [
    {
      title: "PID",
      accessor: (p) => p.pid,
      width: 100,
      filterFun: (v, c) => v.startsWith(c),
    },
    {
      title: "Screened",
      accessor: (u) => u.date_screening.slice(0, 10),
      width: 270,
      filterFun: (v, c) => v.startsWith(c),
    },
  ]
</script>

<Table
  data={{ rows: $participantsReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
