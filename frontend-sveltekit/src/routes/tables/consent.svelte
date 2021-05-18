<script lang="ts">
  import { loginReq, token, consentReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import { fetchTable, tableFilterStartsWith } from "$lib/util"
  import type { Consent } from "$lib/data"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchThisTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(consentReq, token, loginStatus, mounted)
  }

  $: fetchThisTable($token, $loginReq.status, mounted)

  const headers: TableDisplayHeader<Consent>[] = [
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
      title: "Disease",
      accessor: (p) => p.disease,
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Form",
      accessor: (p) => p.form,
      width: 100,
      filter: tableFilterStartsWith,
    },
    {
      title: "Group",
      accessor: (p) => p.group ?? "",
      width: 130,
      filter: tableFilterStartsWith,
    },
  ]
</script>

<Table
  data={{ rows: $consentReq.result?.data ?? [], headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
