<script lang="ts">
  import { loginReq, token, usersReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import { fetchTable, tableFilterStartsWith } from "$lib/util"
  import { accessGroupToString } from "$lib/data"
  import type { User } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchUsers(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(usersReq, token, loginStatus, mounted)
  }

  $: fetchUsers($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<User>[] = [
    {
      title: "Email",
      accessor: (u) => u.email,
      width: 270,
      filter: tableFilterStartsWith,
    },
    {
      title: "Access",
      accessor: (u) => accessGroupToString(u.access_group),
      width: 110,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table data={{ rows: $usersReq.result?.data ?? [], headers }} />
