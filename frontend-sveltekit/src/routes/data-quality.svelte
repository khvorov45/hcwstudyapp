<script lang="ts">
  import { loginReq, token, checkQualityReq } from "$lib/state"
  import type { AsyncStatus } from "$lib/util"
  import { fetchTable } from "$lib/util"
  import { onMount } from "svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchDataQuality(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(checkQualityReq, token, loginStatus, mounted)
  }

  $: fetchDataQuality($token, $loginReq.status, mounted)

  $: console.log($checkQualityReq)
</script>

Data quality
