<script lang="ts">
  import { API_ROOT } from "../lib/config"
  import { usersTable } from "../lib/state"
  import type { AsyncStatus } from "../lib/util"
  import { accessGroupToString } from "../lib/data"
  import { loginStatus } from "../lib/state"
  import { token } from "../lib/state"
  import { onMount } from "svelte"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    if (
      $usersTable.status === "success" ||
      $usersTable.status === "loading" ||
      !mounted
    ) {
      return
    }

    if (token === null || loginStatus !== "success") {
      $usersTable.status === "not-requested"
      $usersTable.data = null
      $usersTable.error = null
    }

    $usersTable.status = "loading"
    $usersTable.error = null

    let res: any
    try {
      res = await fetch(`${API_ROOT}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (e) {
      $usersTable.status = "error"
      $usersTable.data = null
      $usersTable.error = "NETWORK_ERROR: " + e.message
      return
    }

    if (res.status !== 200) {
      $usersTable.status = "error"
      $usersTable.data = null
      $usersTable.error = "FETCH_ERROR: " + (await res.text())
      return
    }

    $usersTable.status = "success"
    $usersTable.data = await res.json()
  }

  $: fetchTable($token, $loginStatus.status, mounted)

  $: console.log($usersTable.data)
</script>

<div class="table-container">
  <div class="table">
    <div class="thead">
      <div class="header-row">
        <div class="th email"><span class="cell-content">Email</span></div>
        <div class="th access"><span class="cell-content">Access</span></div>
      </div>
    </div>
    <div class="tbody">
      {#if $usersTable.data !== null}
        {#each $usersTable.data as user}
          <div class="data-row">
            <div class="td email">
              <span class="cell-content">{user.email}</span>
            </div>
            <div class="td access">
              <span class="cell-content"
                >{accessGroupToString(user.access_group)}</span
              >
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  :root {
    --size-header: 50px;
    --size-data-cell: 30px;
  }
  .table-container {
    width: 100%;
  }
  .table {
    margin-left: auto;
    margin-right: auto;
    max-width: 400px;
  }
  .tbody {
    height: calc(100vh - var(--size-header) - var(--size-nav));
    overflow-y: scroll;
  }
  .thead,
  .thead * {
    height: var(--size-header);
    box-sizing: border-box;
  }
  .header-row {
    border-right: 1px solid var(--color-bg-2);
    border-left: 1px solid var(--color-bg-2);
    border-bottom: 1px solid var(--color-bg-2);
  }
  .th,
  .td {
    display: inline-block;
  }
  .td {
    height: var(--size-data-cell);
  }
  .th {
    border-right: 1px solid var(--color-bg-2);
    height: var(--size-header);
  }
  .th:last-child {
    border-right: 0px;
  }
  .email {
    width: 250px;
  }
  .access {
    width: 100px;
  }
  .cell-content {
    display: flex;
    align-items: center;
  }
  .th > .cell-content {
    justify-content: center;
  }
  .td > .cell-content {
    height: var(--size-data-cell);
    padding-left: 10px;
  }
</style>
