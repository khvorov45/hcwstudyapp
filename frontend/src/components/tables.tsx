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
  Vaccination,
  VaccinationV,
  WeeklySurvey,
  WeeklySurveyV,
} from "../lib/data"
import React, { CSSProperties, useMemo } from "react"
import { Column, useBlockLayout, useTable } from "react-table"
import { FixedSizeList } from "react-window"
import {
  makeStyles,
  Theme,
  createStyles,
  TableContainer,
  Table as MaterialTable,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@material-ui/core"
import detectScrollbarWidth from "../lib/scrollbar-width"
import { useWindowSize } from "../lib/hooks"
import * as d3 from "d3-array"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    nav: {
      overflowX: "scroll",
      overflowY: "hidden",
    },
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

export default function Tables({ token }: { token?: string }) {
  async function tableFetch(name: any, validator: any) {
    return await apiReq({
      method: "GET",
      path: name,
      token: token,
      success: StatusCodes.OK,
      failure: [StatusCodes.UNAUTHORIZED],
      validator: t.array(validator),
    })
  }

  const participantsFetch = useAsync(tableFetch, ["participants", ParticipantV])
  const scheduleFetch = useAsync(tableFetch, ["schedule", ScheduleV])
  const weeklySurveyFetch = useAsync(tableFetch, [
    "weekly-survey",
    WeeklySurveyV,
  ])
  const vaccinationFetch = useAsync(tableFetch, ["vaccination", VaccinationV])

  const participants = useMemo(() => participantsFetch.result ?? [], [
    participantsFetch,
  ])
  const schedule = useMemo(() => scheduleFetch.result ?? [], [scheduleFetch])
  const weeklySurvey = useMemo(() => weeklySurveyFetch.result ?? [], [
    weeklySurveyFetch,
  ])
  const vaccination = useMemo(() => vaccinationFetch.result ?? [], [
    vaccinationFetch,
  ])

  const commonCols = useMemo(
    () => ({
      pid: {
        Header: "PID",
        accessor: (p: any) => p.pid,
        width: 100,
      },
    }),
    []
  )

  const tables = [
    {
      name: "contact",
      element: <Contact participants={participants} commonCols={commonCols} />,
    },
    {
      name: "baseline",
      element: <Baseline participants={participants} commonCols={commonCols} />,
    },
    {
      name: "vaccination",
      element: (
        <VaccinationTable vaccination={vaccination} commonCols={commonCols} />
      ),
    },
    {
      name: "schedule",
      element: <ScheduleTable schedule={schedule} commonCols={commonCols} />,
    },
    {
      name: "weekly-survey",
      element: (
        <WeeklySurveyTable
          weeklySurvey={weeklySurvey}
          commonCols={commonCols}
        />
      ),
    },
    {
      name: "weekly-completion",
      element: (
        <WeeklyCompletion weeklySurvey={weeklySurvey} commonCols={commonCols} />
      ),
    },
    { name: "summary", element: <Summary participants={participants} /> },
  ].map((t) =>
    Object.assign(t, { path: `/tables/${t.name}`, link: `/tables/${t.name}` })
  )

  // Figure out active link
  const matchRes = useRouteMatch<{ table: string }>({ path: "/tables/:table" })
  const currentTable = matchRes?.params.table
  const classes = useStyles()
  return (
    <>
      <SimpleNav
        className={classes.nav}
        links={tables}
        active={(name) => name === currentTable}
      />
      <Route exact path={"/tables"}>
        <Redirect to={tables[0].path} />
      </Route>
      {tables.map((t) => (
        <Route key={t.name} path={t.path}>
          {t.element}
        </Route>
      ))}
    </>
  )
}

function formatDate(d: Date | null | undefined): string {
  if (!d) {
    return ""
  }
  return d.toISOString().split("T")[0]
}

function Contact({
  participants,
  commonCols,
}: {
  participants: Participant[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [
      commonCols.pid,
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
  }, [commonCols])

  return <Table columns={columns} data={participants} />
}

function Baseline({
  participants,
  commonCols,
}: {
  participants: Participant[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [
      commonCols.pid,
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
  }, [commonCols])

  return <Table columns={columns} data={participants} />
}

function ScheduleTable({
  schedule,
  commonCols,
}: {
  schedule: Schedule[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [
      commonCols.pid,
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
  }, [commonCols])

  return <Table columns={columns} data={schedule} />
}

function WeeklySurveyTable({
  weeklySurvey,
  commonCols,
}: {
  weeklySurvey: WeeklySurvey[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [
      commonCols.pid,
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
  }, [commonCols])

  return <Table columns={columns} data={weeklySurvey} />
}

function WeeklyCompletion({
  weeklySurvey,
  commonCols,
}: {
  weeklySurvey: WeeklySurvey[]
  commonCols: any
}) {
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
      commonCols.pid,
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
  }, [weeksAbbr, commonCols])

  return <Table columns={columns} data={weeklyCompletion} />
}

function VaccinationTable({
  vaccination,
  commonCols,
}: {
  vaccination: Vaccination[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [
      commonCols.pid,
      {
        Header: "Year",
        accessor: (p: Vaccination) => p.year,
        width: 100,
      },
      {
        Header: "Status",
        accessor: (p: Vaccination) => p.status,
        width: 100,
      },
    ]
  }, [commonCols])

  return <Table columns={columns} data={vaccination} />
}

function Summary({ participants }: { participants: Participant[] }) {
  const countsBySite = useMemo(
    () =>
      d3.rollup(
        participants,
        (v) => v.length,
        (d) => d.site
      ),
    [participants]
  )

  const counts = Array.from(countsBySite, ([k, v]) => ({
    key: k as string,
    value: v.toString(),
  }))
    .concat([
      { key: "prevVac", value: "Total" },
      { key: "total", value: participants.length.toString() },
    ])
    .reduce((acc, v) => Object.assign(acc, { [v.key]: v.value }), {})

  const columns = useMemo(() => {
    return [
      {
        Header: "Previous vaccinations",
        accessor: (p: any) => p.prevVac,
      },
      {
        Header: "Site",
        columns: Array.from(countsBySite.keys()).map((s) => ({
          Header: s,
          accessor: (p: any) => p[s],
        })),
      },
      {
        Header: "Total",
        accessor: (p: any) => p.total,
        width: 100,
      },
    ]
  }, [countsBySite])

  const table = useTable({ columns: columns, data: [counts] })

  return (
    <TableContainer>
      <MaterialTable {...table.getTableProps()}>
        <TableHead>
          {table.headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((h) => (
                <TableCell {...h.getHeaderProps()}>
                  {h.render("Header")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody {...table.getTableBodyProps()}>
          {table.rows.map((r) => {
            table.prepareRow(r)
            return (
              <TableRow {...r.getRowProps()}>
                {r.cells.map((c) => (
                  <TableCell {...c.getCellProps()}>
                    {c.render("Cell")}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </MaterialTable>
    </TableContainer>
  )
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
            height={windowSize.height - 160}
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
