<script lang="ts">
  import VirtualList from "@sveltejs/svelte-virtual-list"

  import { Sort, nextSort, genericSort, seq } from "$lib/util"
  import type { TableDisplayData, TableDisplayHeader } from "$lib/util"
  import SortIcon from "$lib/components/icons/Sort.svelte"
  import InputField from "$lib/components/InputField.svelte"
  import { scrollbarWidth } from "$lib/state"

  export let data: TableDisplayData<any> = { rows: [], headers: [] }
  export let occupiedHeight = "var(--size-nav)"
  export let heightDataCell = "30px"

  type SortStatus = {
    header: number
    status: Sort
  }

  const sortStatus: SortStatus = { header: 0, status: Sort.Up }

  type FilterStatus = {
    header: number
    value: any
  }

  const filterStatuses: FilterStatus[] = []
  for (let i = 0; i < data.headers.length; i++) {
    filterStatuses.push({
      header: i,
      value: data.headers[i].filter.values === 1 ? "" : ["", ""],
    })
  }

  function processTable<T>(
    rows: T[],
    sortStatus: SortStatus,
    filterStatuses: FilterStatus[]
  ) {
    if (sortStatus.status === Sort.No) {
      return rows
    }
    for (let filterStatus of filterStatuses) {
      if (
        filterStatus.value === "" ||
        (filterStatus.value[0] === "" && filterStatus.value[1] === "")
      ) {
        continue
      }
      const thisHeader = data.headers[filterStatus.header]
      rows = rows.filter((r) =>
        thisHeader.filter.fun(thisHeader.accessor(r), filterStatus.value)
      )
    }
    return rows.sort(
      genericSort(
        data.headers[sortStatus.header].accessor,
        sortStatus.status === Sort.Down
      )
    )
  }

  $: displayData = processTable(data.rows.slice(0), sortStatus, filterStatuses)
  $: displayDataIndices = seq(0, displayData.length)
</script>

<div
  class="table-container"
  style="--occupied-height: {occupiedHeight};
  --scrollbarWidth: {$scrollbarWidth}px;
  --height-data-cell: {heightDataCell};"
>
  <div class="vscroll">
    <div
      class="table"
      style="width: {data.headers.reduce((s, x) => (s += x.width), 0)}px"
    >
      <div class="thead">
        <div class="header-row">
          {#each data.headers as header, i}
            <div class="th {header.title}" style="width: {header.width}px">
              <span class="cell-content header-content"
                ><div
                  class="click-to-sort"
                  style="width: {header.width}px"
                  on:click={() => {
                    if (sortStatus.header === i) {
                      sortStatus.status = nextSort(sortStatus.status)
                    } else {
                      sortStatus.header = i
                      sortStatus.status = nextSort(Sort.No)
                    }
                  }}
                >
                  <span class="title">{header.title}</span>
                  <SortIcon
                    sortOrder={sortStatus.header === i
                      ? sortStatus.status
                      : Sort.No}
                  />
                </div>
                <div class="filter">
                  {#if data.headers[i].filter.values === 1}
                    <InputField
                      bind:value={filterStatuses[i].value}
                      width={`${header.width - 40}px`}
                      placeholder="search..."
                    />
                  {:else}
                    <InputField
                      bind:value={filterStatuses[i].value[0]}
                      width={`${header.width / 2 - 20}px`}
                      placeholder="from"
                    />
                    <br />
                    <InputField
                      bind:value={filterStatuses[i].value[1]}
                      width={`${header.width / 2 - 20}px`}
                      placeholder="to"
                    />
                  {/if}
                </div>
              </span>
            </div>
          {/each}
        </div>
      </div>
      <div class="tbody">
        <VirtualList items={displayDataIndices} let:item>
          <div class="data-row {item % 2 == 0 ? 'even' : 'odd'}">
            {#each data.headers as header}
              <div class="td {header.title}" style="width: {header.width}px">
                <span class="cell-content data-content"
                  >{header.formatter
                    ? header.formatter(header.accessor(displayData[item]))
                    : header.accessor(displayData[item])}</span
                >
              </div>
            {/each}
          </div>
        </VirtualList>
      </div>
    </div>
  </div>
</div>

<style>
  :root {
    --height-header-Table: 70px;
  }
  .table-container {
    width: 100%;
    white-space: nowrap;
  }
  .table-container,
  .table-container * {
    box-sizing: border-box;
  }
  .vscroll {
    max-width: 100%;
    overflow-x: scroll;
    overflow-y: hidden;
  }
  .table {
    margin-left: auto;
    margin-right: auto;
  }
  .tbody {
    height: calc(
      100vh - var(--height-header-Table) - var(--occupied-height) -
        var(--scrollbarWidth)
    );
    overflow-y: hidden;
    overflow-x: hidden;
  }
  .window {
    height: calc(var(--nrow) * var(--height-data-cell));
  }
  .window-padding-top {
    height: calc(var(--itop) * var(--height-data-cell));
  }
  .thead {
    height: var(--height-header-Table);
  }
  .header-row,
  .data-row {
    display: flex;
  }
  .data-row.even {
    background-color: var(--color-bg-2);
  }
  .td {
    height: var(--height-data-cell);
  }
  .th {
    border-right: 1px solid var(--color-bg-2);
    border-bottom: 1px solid var(--color-bg-2);
    height: var(--height-header-Table);
    font-weight: bold;
  }
  .th:first-child {
    border-left: 1px solid var(--color-bg-2);
  }
  .cell-content {
    height: var(--height-header-Table);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .header-content {
    flex-direction: column;
  }
  .data-content {
    white-space: break-spaces;
  }
  .click-to-sort {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .th > .cell-content {
    justify-content: center;
  }
  .td > .cell-content {
    height: var(--height-data-cell);
    padding-left: 10px;
  }
  .filter {
    display: flex;
  }
  .filter br {
    width: 10px;
  }
</style>
