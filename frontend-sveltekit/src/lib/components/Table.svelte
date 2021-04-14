<script lang="ts">
  import { Sort, nextSort, stringSort, seq } from "$lib/util"
  import type { TableDisplayData, TableDisplayHeader } from "$lib/util"
  import SortIcon from "$lib/components/icons/Sort.svelte"
  import InputField from "$lib/components/InputField.svelte"
  import { scrollbarWidth } from "$lib/state"

  export let data: TableDisplayData<any> = { rows: [], headers: [] }
  export let occupiedHeight = "var(--size-nav)"

  function headerWidth(header: TableDisplayHeader<any>, i: number) {
    return header.width + (i + 1 === data.headers.length ? $scrollbarWidth : 0)
  }

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
      stringSort(
        data.headers[sortStatus.header].accessor,
        sortStatus.status === Sort.Down
      )
    )
  }

  let verticalScrollProportion = 0
  function scrollHandle(e: any) {
    verticalScrollProportion = e.target.scrollTop / e.target.scrollTopMax
  }

  let rowsInWindow = 100
  let indexBuffer = seq(0, rowsInWindow - 1)
  function findFirstRow(midRow: number, rowsInWindow: number, nRows: number) {
    let firstRow = midRow - rowsInWindow / 2
    let minFirstRow = 0
    if (firstRow < minFirstRow) {
      firstRow = minFirstRow
    }
    let maxFirstRow = nRows - rowsInWindow
    if (firstRow > maxFirstRow) {
      firstRow = maxFirstRow
    }
    return firstRow
  }
  function recalculateIndices(start: number) {
    for (let i = 0; i < indexBuffer.length; i++) {
      indexBuffer[i] = start + i
    }
  }
  $: displayData = processTable(data.rows.slice(0), sortStatus, filterStatuses)
  $: indexMid = Math.round(verticalScrollProportion * displayData.length)
  $: indexTop = findFirstRow(indexMid, rowsInWindow, displayData.length)
  $: recalculateIndices(indexTop)
</script>

<div
  class="table-container"
  style="--occupied-height: {occupiedHeight}; --scrollbarWidth: {$scrollbarWidth}px"
>
  <div class="vscroll">
    <div
      class="table"
      style="width: {data.headers.reduce((s, x) => (s += x.width), 0) +
        $scrollbarWidth}px"
    >
      <div class="thead">
        <div class="header-row">
          {#each data.headers as header, i}
            <div
              class="th {header.title}"
              style="width: {headerWidth(header, i)}px"
            >
              <span class="cell-content header-content"
                ><div
                  class="click-to-sort"
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
                      width={`${headerWidth(header, i) - 40}px`}
                      placeholder="search..."
                    />
                  {:else}
                    <InputField
                      bind:value={filterStatuses[i].value[0]}
                      width={`${headerWidth(header, i) / 2 - 20}px`}
                      placeholder="from"
                    />
                    <br />
                    <InputField
                      bind:value={filterStatuses[i].value[1]}
                      width={`${headerWidth(header, i) / 2 - 20}px`}
                      placeholder="to"
                    />
                  {/if}
                </div>
              </span>
            </div>
          {/each}
        </div>
      </div>
      <div class="tbody" on:scroll={scrollHandle}>
        <div class="window" style="--nrow: {displayData.length}">
          <div class="window-padding-top" style="--itop: {indexTop}" />
          {#each indexBuffer as i}
            <div class="data-row">
              {#each data.headers as header}
                <div class="td {header.title}" style="width: {header.width}px">
                  <span class="cell-content"
                    >{header.accessor(displayData[i])}</span
                  >
                </div>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  :root {
    --height-header: 70px;
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
      100vh - var(--height-header) - var(--occupied-height) -
        var(--scrollbarWidth)
    );
    overflow-y: scroll;
    overflow-x: hidden;
  }
  .window {
    height: calc(var(--nrow) * var(--height-data-cell));
  }
  .window-padding-top {
    height: calc(var(--itop) * var(--height-data-cell));
  }
  .thead {
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
    font-weight: bold;
  }
  .th:first-child {
    border-left: 1px solid var(--color-bg-2);
  }
  .cell-content {
    height: var(--height-header);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .header-content {
    flex-direction: column;
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
