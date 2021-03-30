<script lang="ts">
  import { usersTable, loginReq, token } from "$lib/state"
  import type { AsyncStatus } from "$lib/util"
  import { Sort, nextSort, stringSort, detectScrollbarWidth } from "$lib/util"
  import { accessGroupToString } from "$lib/data"
  import type { User } from "$lib/data"
  import { onMount } from "svelte"
  import SortIcon from "$lib/components/icons/Sort.svelte"

  const api = process.env.API_ROOT

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
      return
    }

    $usersTable.status = "loading"
    $usersTable.error = null

    let res: any
    try {
      res = await fetch(`${api}/users`, {
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

  $: fetchTable($token, $loginReq.status, mounted)

  let emailSort: Sort = Sort.Up
  function sortEmail() {
    emailSort = nextSort(emailSort)
  }

  function processTable(data: User[], emailSort: Sort) {
    if (emailSort === Sort.No) {
      return data
    }
    return data.sort(stringSort((x) => x.email, emailSort === Sort.Down))
  }

  $: displayData = processTable($usersTable.data?.slice(0) ?? [], emailSort)
</script>

<div
  class="table-container"
  style="--scrollbar-width: {detectScrollbarWidth()}px"
>
  <div class="table">
    <div class="thead">
      <div class="header-row">
        <div class="th email" on:click={sortEmail}>
          <span class="cell-content"
            >Email
            <SortIcon sortOrder={emailSort} /></span
          >
        </div>
        <div class="th access"><span class="cell-content">Access</span></div>
      </div>
    </div>
    <div class="tbody">
      {#each displayData as user}
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
    </div>
  </div>
</div>

<style>
  :root {
    --height-header: 50px;
    --height-data-cell: 30px;
    --width-email: 270px;
    --width-access: 100px;
  }
  .table-container {
    width: 100%;
    white-space: nowrap;
  }
  .table-container,
  .table-container * {
    box-sizing: border-box;
  }
  .table {
    margin-left: auto;
    margin-right: auto;
    max-width: calc(
      var(--width-access) + var(--width-email) + var(--scrollbar-width)
    );
  }
  .tbody {
    height: calc(100vh - var(--height-header) - var(--size-nav));
    overflow-y: scroll;
  }
  .thead,
  .thead * {
    height: var(--height-header);
  }
  .header-row,
  .data-row {
    display: flex;
  }
  .data-row:nth-child(even) {
    background-color: var(--color-bg-2);
  }
  .td {
    height: var(--height-data-cell);
  }
  .th {
    border-right: 1px solid var(--color-bg-2);
    border-bottom: 1px solid var(--color-bg-2);
    height: var(--height-header);
    cursor: pointer;
    font-weight: bold;
  }
  .th:first-child {
    border-left: 1px solid var(--color-bg-2);
  }
  .email {
    width: var(--width-email);
  }
  .access {
    width: calc(var(--width-access) + var(--scrollbar-width));
  }
  .cell-content {
    display: flex;
    align-items: center;
  }
  .th > .cell-content {
    justify-content: center;
  }
  .td > .cell-content {
    height: var(--height-data-cell);
    padding-left: 10px;
  }
</style>
