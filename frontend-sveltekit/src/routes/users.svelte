<script lang="ts">
  import { loginReq, token, usersReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
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
    if (
      $usersReq.status === "success" ||
      $usersReq.status === "loading" ||
      !mounted
    ) {
      return
    }
    if (token === null || loginStatus !== "success") {
      $usersReq.status === "not-requested"
      $usersReq.result.data = null
      $usersReq.result.error = null
      return
    }

    await usersReq.execute({ token })

    if ($usersReq.result?.error !== null) {
      console.error($usersReq.result.error)
    }
  }

  $: fetchUsers($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<User>[] = [
    {
      title: "Email",
      accessor: (u) => u.email,
      width: 270,
    },
    {
      title: "Access",
      accessor: (u) => accessGroupToString(u.access_group),
      width: 110,
    },
  ]
</script>

<Table data={{ rows: $usersReq.result?.data ?? [], headers }} />
