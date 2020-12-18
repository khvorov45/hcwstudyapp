import { Redirect, Route, useRouteMatch } from "react-router-dom"
import StatusCodes from "http-status-codes"
import * as t from "io-ts"
import { SimpleNav } from "./nav"
import { useAsync } from "react-async-hook"
import { apiReq } from "../lib/api"
import {
  Participant,
  ParticipantV,
  Schedule,
  ScheduleV,
  WeeklySurvey,
  WeeklySurveyV,
} from "../lib/data"
import { CSSProperties, useMemo } from "react"
import { Column, useBlockLayout, useTable } from "react-table"
import { FixedSizeList } from "react-window"
import { makeStyles, Theme, createStyles } from "@material-ui/core"
import detectScrollbarWidth from "../lib/scrollbar-width"
import { useWindowSize } from "../lib/hooks"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    tableContainer: {
      display: "flex",
      justifyContent: "center",
    },
    table: {
      overflow: "auto",
      "& .header": {
        height: 35,
        whiteSpace: "nowrap",
        borderBottom: `1px solid ${theme.palette.divider}`,
        "&>*": {
          borderRight: `1px solid ${theme.palette.divider}`,
        },
        "&>*:first-child": {
          borderLeft: `1px solid ${theme.palette.divider}`,
        },
      },
      "& .body": {
        "& .rowEven": {
          background: theme.palette.background.alt,
        },
      },
      "& .th, & .td": {
        padding: "0.5rem",
      },
    },
  })
)

export default function Tables({ token }: { token: string | null }) {
  const tableNames = [
    "contact",
    "baseline",
    "schedule",
    "weekly-survey",
    "weekly-completion",
    "summary",
  ]
  const tablePaths = tableNames.map((n) => `/tables/${n}`)
  const tableLinks = tablePaths.map((n) => `${n}?token=${token}`)
  const tableNamedLinks = tableNames.map((n, i) => ({
    name: n,
    link: tableLinks[i],
  }))

  const participantsFetch = useAsync(
    () =>
      apiReq({
        method: "GET",
        path: "participants",
        token: token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: t.array(ParticipantV),
      }),
    []
  )

  const scheduleFetch = useAsync(
    () =>
      apiReq({
        method: "GET",
        path: "schedule",
        token: token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: t.array(ScheduleV),
      }),
    []
  )

  const weeklySurveyFetch = useAsync(
    () =>
      apiReq({
        method: "GET",
        path: "weekly-survey",
        token: token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: t.array(WeeklySurveyV),
      }),
    []
  )

  const participants = useMemo(() => participantsFetch.result ?? [], [
    participantsFetch,
  ])
  const schedule = useMemo(() => scheduleFetch.result ?? [], [scheduleFetch])
  const weeklySurvey = useMemo(() => weeklySurveyFetch.result ?? [], [
    weeklySurveyFetch,
  ])

  // Figure out active link
  const matchRes = useRouteMatch<{ table: string }>({ path: "/tables/:table" })
  const currentTable = matchRes?.params.table

  return (
    <>
      <SimpleNav
        links={tableNamedLinks}
        active={(name) => name === currentTable}
      />
      <Route exact path={"/tables"}>
        <Redirect to={tableLinks[0]} />
      </Route>
      <Route path={tablePaths[0]}>
        <Contact participants={participants} />
      </Route>
      <Route path={tablePaths[1]}>
        <Baseline participants={participants} />
      </Route>
      <Route path={tablePaths[2]}>
        <ScheduleTable schedule={schedule} />
      </Route>
      <Route path={tablePaths[3]}>
        <WeeklySurveyTable weeklySurvey={weeklySurvey} />
      </Route>
      <Route path={tablePaths[4]}>
        <WeeklyCompletion weeklySurvey={weeklySurvey} />
      </Route>
      <Route path={tablePaths[5]}>Summary</Route>
    </>
  )
}

function formatDate(d: Date | null | undefined): string {
  if (!d) {
    return ""
  }
  return d.toISOString().split("T")[0]
}

function Contact({ participants }: { participants: Participant[] }) {
  const columns = useMemo(() => {
    return [
      {
        Header: "PID",
        accessor: (p: Participant) => p.pid,
        width: 75,
      },
      {
        Header: "Email",
        accessor: (p: Participant) => p.email,
        width: 400,
      },
      {
        Header: "Mobile",
        accessor: (p: Participant) => p.mobile,
        width: 120,
      },
      {
        Header: "Screened",
        accessor: (p: Participant) => formatDate(p.dateScreening),
        width: 100,
      },
      {
        Header: "Site",
        accessor: (p: Participant) => p.site,
        width: 100,
      },
    ]
  }, [])

  return <Table columns={columns} data={participants} />
}

function Baseline({ participants }: { participants: Participant[] }) {
  const columns = useMemo(() => {
    return [
      {
        Header: "PID",
        accessor: (p: Participant) => p.pid,
        width: 75,
      },
      {
        Header: "DoB",
        accessor: (p: Participant) => formatDate(p.dob),
        width: 100,
      },
      {
        Header: "Gender",
        accessor: (p: Participant) => p.gender,
        width: 75,
      },
      {
        Header: "Site",
        accessor: (p: Participant) => p.site,
        width: 100,
      },
    ]
  }, [])

  return <Table columns={columns} data={participants} />
}

function ScheduleTable({ schedule }: { schedule: Schedule[] }) {
  const columns = useMemo(() => {
    return [
      {
        Header: "PID",
        accessor: (p: Schedule) => p.pid,
        width: 75,
      },
      {
        Header: "Year",
        accessor: (p: Schedule) => p.redcapProjectYear,
        width: 75,
      },
      {
        Header: "Day",
        accessor: (p: Schedule) => p.day,
        width: 75,
      },
      {
        Header: "Date",
        accessor: (p: Schedule) => formatDate(p.date),
        width: 100,
      },
    ]
  }, [])

  return <Table columns={columns} data={schedule} />
}

function WeeklySurveyTable({ weeklySurvey }: { weeklySurvey: WeeklySurvey[] }) {
  const columns = useMemo(() => {
    return [
      {
        Header: "PID",
        accessor: (p: WeeklySurvey) => p.pid,
        width: 75,
      },
      {
        Header: "Week",
        accessor: (p: WeeklySurvey) => p.index,
        width: 75,
      },
      {
        Header: "Year",
        accessor: (p: WeeklySurvey) => p.redcapProjectYear,
        width: 75,
      },
      {
        Header: "Date",
        accessor: (p: WeeklySurvey) => formatDate(p.date),
        width: 100,
      },
      {
        Header: "ARI",
        accessor: (p: WeeklySurvey) => p.ari.toString(),
        width: 75,
      },
      {
        Header: "Swab",
        accessor: (p: WeeklySurvey) =>
          p.swabCollection ? p.swabCollection.toString() : "",
        width: 75,
      },
    ]
  }, [])

  return <Table columns={columns} data={weeklySurvey} />
}

function WeeklyCompletion({ weeklySurvey }: { weeklySurvey: WeeklySurvey[] }) {
  type WeeklyCompletion = {
    pid: string
    year: number
    weeks: number[]
  }

  const weeklyCompletion: WeeklyCompletion[] = []
  weeklySurvey
    .sort((a, b) => (a.pid < b.pid ? 1 : a.pid > b.pid ? -1 : 0))
    .reduce((a, s) => {
      if (a[a.length - 1]?.pid === s.pid) {
        a[a.length - 1].weeks.push(s.index)
      } else {
        a.push({ pid: s.pid, year: s.redcapProjectYear, weeks: [s.index] })
      }
      return a
    }, weeklyCompletion)

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

  const weeksAbbr = weeklyCompletion.map((w) => w.weeks).map(abbreviateSequence)

  const columns = useMemo(() => {
    return [
      {
        Header: "PID",
        accessor: (p: WeeklyCompletion) => p.pid,
        width: 75,
      },
      {
        Header: "Year",
        accessor: (p: WeeklyCompletion) => p.year,
        width: 50,
      },
      {
        Header: "Completed",
        accessor: (p: WeeklyCompletion, i: number) => weeksAbbr[i],
        width:
          weeksAbbr.map((w) => w.length).reduce((p, c) => (p > c ? p : c), 0) *
          7,
      },
    ]
  }, [weeksAbbr])

  return <Table columns={columns} data={weeklyCompletion} />
}

function Table<T extends object>({
  columns,
  data,
}: {
  columns: Column<T>[]
  data: T[]
}) {
  const table = useTable<T>(
    {
      columns: columns,
      data: data,
    },
    useBlockLayout
  )
  function renderRow({
    index,
    style,
  }: {
    index: number
    style: CSSProperties
  }) {
    const r = table.rows[index]
    table.prepareRow(r)
    return (
      <div
        {...r.getRowProps({ style })}
        className={`tr ${index % 2 === 1 ? "rowEven" : ""}`}
      >
        {r.cells.map((c) => (
          <div {...c.getCellProps()} className="td">
            {c.render("Cell")}
          </div>
        ))}
      </div>
    )
  }
  const classes = useStyles()
  const scrollbarWidth = useMemo(() => detectScrollbarWidth(), [])
  const windowSize = useWindowSize()
  return (
    <div className={classes.tableContainer}>
      <div {...table.getTableProps()} className={classes.table}>
        {/*Headers*/}
        <div className="tr header" style={{ width: table.totalColumnsWidth }}>
          {table.headers.map((h) => (
            <div {...h.getHeaderProps()} className="th">
              {h.render("Header")}
            </div>
          ))}
        </div>
        {/*Body*/}
        <div {...table.getTableBodyProps()} className="body">
          <FixedSizeList
            height={windowSize.height - 150}
            itemCount={table.rows.length}
            itemSize={35}
            width={table.totalColumnsWidth + scrollbarWidth}
          >
            {renderRow}
          </FixedSizeList>
        </div>
      </div>
    </div>
  )
}
