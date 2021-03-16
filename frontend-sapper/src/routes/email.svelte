<script lang="ts">
  import { API_ROOT } from "../lib/config"

  import type { AsyncStatus } from "../lib/util"

  let email = ""

  let emailStatus: { status: AsyncStatus; error: string | null } = {
    status: "not-requested",
    error: null,
  }

  async function handleSend() {
    emailStatus.status = "loading"
    emailStatus.error = null
    let res: any
    try {
      res = await fetch(
        `${API_ROOT}/auth/token/send?email=${email}&type=Session`,
        { method: "POST" }
      )
    } catch (e) {
      emailStatus.status = "error"
      emailStatus.error = "NETWORK_ERROR: " + e.message
      return
    }
    if (res.status !== 204) {
      emailStatus.status = "error"
      emailStatus.error = await res.json()
    } else {
      emailStatus.status = "success"
      emailStatus.error = null
    }
  }
</script>

<input bind:value={email} />
<button on:click={handleSend}>Sumbit</button>
<p>email status: {emailStatus.status}</p>
<p>email error: {emailStatus.error}</p>
