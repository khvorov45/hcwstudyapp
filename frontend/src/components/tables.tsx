import { Redirect, Route, useRouteMatch } from "react-router-dom"
import { SimpleNav } from "./nav"
import {
  GenderV,
  Participant,
  Schedule,
  Serology,
  Site,
  SiteV,
  Vaccination,
  VaccinationStatusV,
  WeeklySurvey,
  Withdrawn,
} from "../lib/data"
import React, { CSSProperties, useMemo, useState } from "react"
import {
  Column,
  FilterProps,
  useBlockLayout,
  useFilters,
  useTable,
} from "react-table"
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
  TextField,
  Select,
  MenuItem,
} from "@material-ui/core"
import detectScrollbarWidth from "../lib/scrollbar-width"
import { useWindowSize } from "../lib/hooks"
import * as d3 from "d3-array"
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers"
import DateFnsUtils from "@date-io/moment"
import { Moment } from "moment"

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
        height: 60,
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
      "& .header-content": {
        display: "flex",
        flexDirection: "column",
      },
    },
    numberFilter: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    datePicker: {
      maxWidth: 145,
    },
    columnName: {
      margin: "auto",
      fontWeight: "bold",
    },
    summaryTable: {
      margin: "auto",
      maxWidth: 800,
      "& th, & td": {
        textAlign: "center",
        paddingTop: 5,
        paddingBottom: 5,
      },
      "& .site-overhead": {
        background: theme.palette.background.alt,
      },
      "& td": {
        borderBottom: 0,
      },
      "& th": {
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      "& th:first-child": {
        borderLeft: `1px solid ${theme.palette.divider}`,
      },
      "& .data-row:nth-child(even)": {
        background: theme.palette.background.alt,
      },
      "& .data-row.label-row": {
        "& td:first-child": {
          textAlign: "left",
        },
      },
    },
  })
)

export default function Tables({
  participantsExtra,
  vaccination,
  schedule,
  weeklySurvey,
  withdrawn,
  serology,
}: {
  participantsExtra: (Participant & { age: number; prevVac: number })[]
  vaccination: Vaccination[]
  schedule: Schedule[]
  weeklySurvey: WeeklySurvey[]
  withdrawn: Withdrawn[]
  serology: (Serology & { site?: Site })[]
}) {
  const commonCols = useMemo(
    () => ({
      pid: {
        Header: "PID",
        accessor: (p: any) => p.pid,
        width: 100,
      },
      site: {
        Header: "Site",
        accessor: (p: any) => p.site,
        width: 100,
        Filter: getSelectColumnFilter(Object.keys(SiteV.keys)),
      },
      date: ({ name, header }: { name: string; header: string }) => ({
        Header: header,
        accessor: (p: any) => formatDate(p[name]),
        width: 330,
        filter: "betweenDates",
        Filter: DateRangeColumnFilter,
      }),
      year: ({
        name,
        start,
        end,
      }: {
        name: string
        start: number
        end: number
      }) => ({
        Header: "Year",
        accessor: (p: any) => p[name],
        width: 75,
        filter: "exactText",
        Filter: getSelectColumnFilter(
          Array.from(Array(end - start + 1).keys())
            .map((a) => a + start)
            .map((a) => a.toString())
        ),
      }),
      bool: ({
        name,
        header,
        missing,
      }: {
        name: string
        header: string
        missing: boolean
      }) => ({
        Header: header,
        accessor: (p: any) => {
          if (missing) {
            return p[name] !== null && p[name] !== undefined
              ? p[name].toString()
              : "(missing)"
          }
          return p[name].toString()
        },
        width: 75,
        Filter: getSelectColumnFilter(
          missing ? ["true", "false", "(missing)"] : ["true", "false"]
        ),
      }),
    }),
    []
  )

  const tables = [
    {
      name: "contact",
      element: (
        <Contact participants={participantsExtra} commonCols={commonCols} />
      ),
    },
    {
      name: "baseline",
      element: (
        <Baseline participants={participantsExtra} commonCols={commonCols} />
      ),
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
    {
      name: "withdrawn",
      element: <WithdrawnTable withdrawn={withdrawn} commonCols={commonCols} />,
    },
    {
      name: "serology",
      element: <SerologyTable serology={serology} commonCols={commonCols} />,
    },
    {
      name: "summary",
      element: <Summary participantsExtra={participantsExtra} />,
    },
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
        active={({ name }) => name === currentTable}
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

function toTitleCase(s: string): string {
  return s[0].toUpperCase() + s.slice(1)
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
      commonCols.date({ name: "dateScreening", header: "Screened" }),
      commonCols.site,
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
      commonCols.date({ name: "dob", header: "DoB" }),
      {
        Header: "Gender",
        accessor: (p: Participant) => p.gender ?? "(missing)",
        width: 75,
        Filter: getSelectColumnFilter(
          Object.keys(GenderV.keys).concat(["(missing)"])
        ),
      },
      {
        Header: "Vaccinations",
        accessor: (p: any) => p.prevVac,
      },
      commonCols.site,
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
      commonCols.year({ name: "redcapProjectYear", start: 2020, end: 2021 }),
      {
        Header: "Day",
        accessor: (p: Schedule) => p.day,
        width: 75,
        Filter: getSelectColumnFilter(["0", "7", "14", "280"]),
      },
      commonCols.date({ name: "date", header: "Date" }),
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
        filter: "exactText",
        Filter: getSelectColumnFilter(
          Array.from(Array(32).keys()).map((a) => (a + 1).toString())
        ),
      },
      commonCols.year({ name: "redcapProjectYear", start: 2020, end: 2021 }),
      commonCols.date({ name: "date", header: "Date" }),
      commonCols.bool({ name: "ari", header: "ARI", missing: false }),
      commonCols.bool({
        name: "swabCollection",
        header: "Swab",
        missing: true,
      }),
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
      commonCols.year({ name: "year", start: 2020, end: 2021 }),
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
      commonCols.year({ name: "year", start: 2015, end: 2020 }),
      {
        Header: "Status",
        accessor: (p: Vaccination) => p.status ?? "(missing)",
        width: 100,
        Filter: getSelectColumnFilter(
          Object.keys(VaccinationStatusV.keys).concat(["(missing)"])
        ),
      },
    ]
  }, [commonCols])

  return <Table columns={columns} data={vaccination} />
}

function WithdrawnTable({
  withdrawn,
  commonCols,
}: {
  withdrawn: Withdrawn[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [commonCols.pid, commonCols.date({ name: "date", header: "Date" })]
  }, [commonCols])

  return <Table columns={columns} data={withdrawn} />
}

function SerologyTable({
  serology,
  commonCols,
}: {
  serology: Serology[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [
      commonCols.pid,
      commonCols.year({ name: "redcapProjectYear", start: 2020, end: 2021 }),
      {
        Header: "Day",
        accessor: "day",
        filter: "exactText",
        width: 70,
      },
      {
        Header: "Virus",
        accessor: "virus",
        width: 300,
      },
      {
        Header: "Titre",
        accessor: "titre",
        filter: "exactText",
        width: 70,
      },
    ]
  }, [commonCols])

  return <Table columns={columns} data={serology} />
}

function useCounted<T extends Object, K extends keyof T>(
  data: Pick<T, K>[],
  key: K
) {
  const counted = useMemo(
    () =>
      d3.rollup(
        data,
        (v) => v.length,
        (d) => d[key]
      ),
    [data, key]
  )
  return counted
}

function summariseNumerical(ns: number[]): string {
  return `${Math.round(d3.mean(ns) ?? 0)} (${Math.round(
    d3.deviation(ns) ?? 0
  )})`
}

function Summary({
  participantsExtra,
}: {
  participantsExtra: (Participant & { age: number; prevVac: number })[]
}) {
  const countsBySite = useCounted(participantsExtra, "site")
  const countsByVac = useCounted(participantsExtra, "prevVac")
  const countsByGender = useCounted(participantsExtra, "gender")
  const ageBySite = useMemo(
    () =>
      d3.rollup(
        participantsExtra,
        (v) => summariseNumerical(v.map((v) => v.age)),
        (d) => d.site
      ),
    [participantsExtra]
  )

  const countsByGenderSite = useMemo(
    () =>
      d3.rollup(
        participantsExtra,
        (v) => v.length,
        (d) => d.gender,
        (d) => d.site
      ),
    [participantsExtra]
  )

  const countsByVacSite = useMemo(
    () =>
      d3.rollup(
        participantsExtra,
        (v) => v.length,
        (d) => d.prevVac,
        (d) => d.site
      ),
    [participantsExtra]
  )

  // Convert the counts above to the appropriate table

  function toWide(v: Map<string, number | string>) {
    return Array.from(v, ([k, v]) => ({
      key: k,
      value: v,
    })).reduce((acc, v) => Object.assign(acc, { [v.key]: v.value }), {})
  }

  type Row = { label?: string | number; total?: number | string }

  const ageRow: Row = {
    label: "Age: mean (sd)",
    total: summariseNumerical(participantsExtra.map((p) => p.age)),
    ...toWide(ageBySite),
  }

  const bottomRow = {
    label: "Total",
    total: participantsExtra.length,
    ...toWide(countsBySite),
  }

  const emptyRow: (title?: string | number) => Row[] = (
    title?: string | number
  ) => [{ label: title, total: undefined }]

  const countsByVacSiteWithMarginal = Array.from(countsByVacSite, ([k, v]) => ({
    label: k ? k.toString() : k,
    ...toWide(v),
    total: countsByVac.get(k),
  })).sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))

  const countsByGenderSiteWithMarginal = Array.from(
    countsByGenderSite,
    ([k, v]) => ({
      label: k ? k.toString() : "(missing)",
      ...toWide(v),
      total: countsByGender.get(k),
    })
  )

  const counts = [ageRow]
    .concat(emptyRow("Vaccinations"))
    .concat(countsByVacSiteWithMarginal)
    .concat(emptyRow("Gender"))
    .concat(countsByGenderSiteWithMarginal)
    .concat(bottomRow)

  const columns = useMemo(() => {
    return [
      {
        Header: "",
        id: "var",
        accessor: (p: any) => p.label,
      },
      {
        Header: "Site",
        columns: Array.from(countsBySite.keys()).map((s) => ({
          Header: toTitleCase(s),
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

  return (
    <SummaryTable
      columns={columns}
      data={counts}
      overheadColumnId="Site_1"
      isLabelRow={(r) =>
        r.label && typeof r.label === "string"
          ? ["Vaccinations", "Gender", "Total"].includes(r.label)
          : false
      }
    />
  )
}

function SummaryTable<T extends object>({
  columns,
  data,
  overheadColumnId,
  isLabelRow,
}: {
  columns: Column<T>[]
  data: T[]
  overheadColumnId: string
  isLabelRow: (t: T) => boolean
}) {
  const table = useTable({ columns, data })
  const classes = useStyles()
  return (
    <TableContainer className={classes.summaryTable}>
      <MaterialTable {...table.getTableProps()}>
        <TableHead>
          {table.headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((h) => (
                <TableCell
                  {...h.getHeaderProps()}
                  className={h.id === overheadColumnId ? "site-overhead" : ""}
                >
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
              <TableRow
                {...r.getRowProps()}
                className={`data-row ${
                  isLabelRow(r.original) ? "label-row" : ""
                }`}
              >
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
  const filterTypes = useMemo(
    () => ({
      betweenDates: (
        rows: any[],
        ids: any[],
        filterValue?: [Date | undefined, Date | undefined]
      ) => {
        const [min, max] = filterValue || []
        if (min === undefined && max === undefined) {
          return rows
        }

        let minTime = min instanceof Date ? min.getTime() : -Infinity
        let maxTime = max instanceof Date ? max.getTime() : Infinity

        if (minTime > maxTime) {
          const temp = minTime
          minTime = maxTime
          maxTime = temp
        }
        return rows.filter((row) => {
          return ids.some((id) => {
            const rowValue = new Date(row.values[id]).getTime()
            return rowValue >= minTime && rowValue <= maxTime
          })
        })
      },
    }),
    []
  )
  const defaultColumn = useMemo(
    () => ({
      Filter: DefaultColumnFilter,
    }),
    []
  )
  const table = useTable<T>(
    {
      columns,
      data,
      defaultColumn,
      filterTypes,
    },
    useBlockLayout,
    useFilters
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
              <div className="header-content">
                <div className={classes.columnName}>{h.render("Header")}</div>
                {h.render("Filter")}
              </div>
            </div>
          ))}
        </div>
        {/*Body*/}
        <div {...table.getTableBodyProps()} className="body">
          <FixedSizeList
            height={windowSize.height - 50 - 50 - 60 - detectScrollbarWidth()}
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

function DefaultColumnFilter<T extends Object>({
  column: { filterValue, preFilteredRows, setFilter },
}: FilterProps<T>) {
  return (
    <TextField
      value={filterValue || ""}
      onChange={(e) => {
        setFilter(e.target.value || undefined)
      }}
      placeholder={`Search...`}
    />
  )
}

export function DateRangeColumnFilter<T extends Object>({
  column: { setFilter },
}: FilterProps<T>) {
  const [lowvalue, setLowvalue] = useState<Moment | null>(null)
  const [highvalue, setHighvalue] = useState<Moment | null>(null)
  const classes = useStyles()
  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <div className={classes.numberFilter}>
        <KeyboardDatePicker
          value={lowvalue}
          onChange={(d) => {
            setLowvalue(d)
            setFilter((old = []) => [
              d?.isValid() ? d.toDate() : undefined,
              old[1],
            ])
          }}
          format="yyyy-MM-DD"
          placeholder="yyyy-mm-dd"
          className={classes.datePicker}
          helperText=""
        />
        -
        <KeyboardDatePicker
          value={highvalue}
          onChange={(d) => {
            setHighvalue(d)
            setFilter((old = []) => [
              old[0],
              d?.isValid() ? d.toDate() : undefined,
            ])
          }}
          format="yyyy-MM-DD"
          placeholder="yyyy-mm-dd"
          className={classes.datePicker}
          helperText=""
        />
      </div>
    </MuiPickersUtilsProvider>
  )
}

function getSelectColumnFilter(opts: string[]) {
  function SelectColumnFilter<T extends Object>({
    column: { setFilter },
  }: FilterProps<T>) {
    const [val, setVal] = useState("any")
    return (
      <Select
        value={val}
        onChange={(e) => {
          const v = e.target.value as string
          setVal(v)
          if (v === "any") {
            setFilter(undefined)
          } else {
            setFilter(v)
          }
        }}
      >
        <MenuItem value={"any"}>Any</MenuItem>
        {opts.map((o) => (
          <MenuItem key={o} value={o}>
            {o}
          </MenuItem>
        ))}
      </Select>
    )
  }
  return SelectColumnFilter
}
