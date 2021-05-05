<script lang="ts">
  import { loginReq, token, weeklySurveyReq } from "$lib/state"
  import type { AsyncStatus, TableDisplayHeader } from "$lib/util"
  import {
    fetchTable,
    tableFilterStartsWith,
    tableFilterIncludes,
  } from "$lib/util"
  import { onMount } from "svelte"
  import Table from "$lib/components/Table.svelte"
  import type { WeeklySurvey } from "$lib/data"

  let mounted = false
  onMount(() => (mounted = true))

  async function fetchThisTable(
    token: string | null,
    loginStatus: AsyncStatus,
    mounted: boolean
  ) {
    await fetchTable(weeklySurveyReq, token, loginStatus, mounted)
  }

  $: fetchThisTable($token, $loginReq.status, mounted)

  type WeeklyCompletion = {
    pid: string
    year: number
    weeks: number[]
  }

  function createWeeklyCompletion(data: WeeklySurvey[]) {
    const result: WeeklyCompletion[] = []
    data
      .sort((a, b) => a.year - b.year)
      .sort((a, b) => (a.pid < b.pid ? 1 : a.pid > b.pid ? -1 : 0))
      .reduce((a, s) => {
        if (
          a[a.length - 1]?.pid === s.pid &&
          a[a.length - 1]?.year === s.year
        ) {
          a[a.length - 1].weeks.push(s.index)
        } else {
          a.push({ pid: s.pid, year: s.year, weeks: [s.index] })
        }
        return a
      }, result)
    return result
  }

  $: weeklyCompletion = createWeeklyCompletion(
    $weeklySurveyReq.result?.data ?? []
  )

  function abbreviateSequence(s: number[]): string {
    const startEnds: string = ""
    const abbr = s
      .sort((a, b) => (a > b ? 1 : b > a ? -1 : 0))
      .reduce((cur, n, i, a) => {
        // First element
        if (i === 0) {
          return `${n}`
        }
        const inSeq = a[i - 1] + 1 === n
        // Last element
        if (i === a.length - 1) {
          if (inSeq) {
            return cur + `-${n}`
          } else {
            return cur + ` ${n}`
          }
        }
        // Middle element
        if (!inSeq) {
          return cur + ` ${n}`
        }
        if (inSeq && a[i + 1] !== n + 1) {
          return cur + `-${n}`
        }
        return cur
      }, startEnds)
    return abbr
  }

  const headers: TableDisplayHeader<WeeklyCompletion>[] = [
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
      title: "Weeks",
      accessor: (p) => abbreviateSequence(p.weeks),
      width: 260,
      filter: tableFilterIncludes,
    },
  ]
</script>

<Table
  data={{ rows: weeklyCompletion, headers }}
  occupiedHeight={"calc(var(--size-nav) * 2)"}
/>
