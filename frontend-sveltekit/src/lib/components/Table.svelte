<script lang="ts">
  import { detectScrollbarWidth, Sort, nextSort, stringSort } from "$lib/util"
  import type { TableDisplayData, TableDisplayHeader } from "$lib/util"
  import SortIcon from "$lib/components/icons/Sort.svelte"

  export let data: TableDisplayData<any> = { rows: [], headers: [] }

  const scrollbarWidth = detectScrollbarWidth()

  function headerWidth(header: TableDisplayHeader<any>, i: number) {
    return header.width + (i + 1 === data.headers.length ? scrollbarWidth : 0)
  }

  type SortStatus = {
    header: number
    status: Sort
  }

  const sortStatus: SortStatus = { header: 0, status: Sort.Up }

  function processTable<T>(rows: T[], sortStatus: SortStatus) {
    if (sortStatus.status === Sort.No) {
      return rows
    }
    return rows.sort(
      stringSort(
        data.headers[sortStatus.header].accessor,
        sortStatus.status === Sort.Down
      )
    )
  }

  $: displayData = processTable(data.rows.slice(0), sortStatus)
</script>

<div class="table-container">
  <div
    class="table"
    style="width: {data.headers.reduce((s, x) => (s += x.width), 0) +
      scrollbarWidth}px"
  >
    <div class="thead">
      <div class="header-row">
        {#each data.headers as header, i}
          <div
            class="th {header.title}"
            style="width: {headerWidth(header, i)}px"
            on:click={() => {
              if (sortStatus.header === i) {
                sortStatus.status = nextSort(sortStatus.status)
              } else {
                sortStatus.header = i
                sortStatus.status = nextSort(Sort.No)
              }
            }}
          >
            <span class="cell-content"
              >{header.title}
              <SortIcon
                sortOrder={sortStatus.header === i
                  ? sortStatus.status
                  : Sort.No}
              />
            </span>
          </div>
        {/each}
      </div>
    </div>
    <div class="tbody">
      {#each displayData as row}
        <div class="data-row">
          {#each data.headers as header}
            <div class="td {header.title}" style="width: {header.width}px">
              <span class="cell-content">{header.accessor(row)}</span>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  :root {
    --height-header: 50px;
    --height-data-cell: 30px;
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
