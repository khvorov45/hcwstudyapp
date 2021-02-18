import { Redirect, Route, useRouteMatch } from "react-router-dom"
import { SimpleNav } from "./nav"
import {
  GenderV,
  Participant as ParticipantFull,
  Schedule,
  Site,
  SiteV,
  Vaccination,
  VaccinationStatusV,
  Virus,
  WeeklySurvey,
  Withdrawn,
  User,
} from "../lib/data"
import { Participant, VaccinationCount } from "../lib/table-data"
import React, {
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  Column,
  FilterProps,
  useBlockLayout,
  useFilters,
  useSortBy,
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
  useTheme,
} from "@material-ui/core"
import detectScrollbarWidth from "../lib/scrollbar-width"
import { useWindowSize } from "../lib/hooks"
import {
  KeyboardDatePicker,
  MuiPickersUtilsProvider,
} from "@material-ui/pickers"
import DateFnsUtils from "@date-io/moment"
import { Moment } from "moment"
import { Icon } from "@iconify/react"
import sortIcon from "@iconify/icons-fa-solid/sort"
import sortUpIcon from "@iconify/icons-fa-solid/sort-up"
import sortDownIcon from "@iconify/icons-fa-solid/sort-down"
import { ParticipantExtra, SerologyExtra, TitreChange } from "../lib/table-data"
import {
  ControlRibbon,
  Selector,
  SelectorMultiple,
  SiteSelect,
  StudyYearSelector,
  StudyYearSelectorMultiple,
} from "./control-ribbon"
import {
  applyMultiFilter,
  findBreaks,
  insertInPlace,
  numberSort,
  rollup,
  round,
  stringSort,
  summariseCount,
  summariseLogmean,
  summariseNumeric,
  summariseProportion,
  unique,
} from "../lib/util"
import { STUDY_YEARS } from "../lib/config"

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
        height: 70,
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
        textAlign: "center",
      },
      "& .th": {
        "& .header-content": {
          display: "flex",
          flexDirection: "column",
        },
        "& .clickable": {
          display: "grid",
          gridTemplateAreas: `"name sort"`,
          gridTemplateColumns: "auto 2ch",
          "& .name": {
            gridArea: "name",
          },
          "& .sort": {
            gridArea: "sort",
          },
        },
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
      fontWeight: "bold",
    },
    summaryTable: {
      margin: "auto",
      maxWidth: 900,
      "& th, & td": {
        textAlign: "center",
        paddingTop: 5,
        paddingBottom: 5,
        minWidth: 100,
      },
      "& .site-overhead": {
        background: theme.palette.background.alt,
      },
      "& td": {
        borderBottom: 0,
      },
      "& thead": {
        borderBottom: `1px solid ${theme.palette.divider}`,
        "&>tr>th": {
          borderBottom: 0,
        },
      },
      "& .data-row.label-row": {
        background: theme.palette.background.alt,
        borderTop: `1px solid ${theme.palette.divider}`,
      },
      "& .data-row.label-row:first-child": {
        borderTop: 0,
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
  virus,
  serology,
  titreChange,
  vaccinationCounts,
  user,
}: {
  participantsExtra?: ParticipantExtra[]
  vaccination?: Vaccination[]
  schedule?: Schedule[]
  weeklySurvey?: WeeklySurvey[]
  withdrawn?: Withdrawn[]
  virus?: Virus[]
  serology?: SerologyExtra[]
  titreChange?: TitreChange[]
  vaccinationCounts?: VaccinationCount[]
  user?: User
}) {
  const commonCols = useMemo(
    () => ({
      pid: {
        Header: "PID",
        id: "pid",
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
      clade: (s: string) => ({
        Header: "Clade",
        accessor: s,
        filter: "exactText",
        width: 100,
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
      name: "virus",
      element: <VirusTable virus={virus} commonCols={commonCols} />,
    },
    {
      name: "serology",
      element: <SerologyTable serology={serology} commonCols={commonCols} />,
    },
    {
      name: "summary",
      element: (
        <Summary
          participantsExtraFull={participantsExtra}
          serologyFull={serology}
          titreChangeFull={titreChange}
          vaccinationCountsFull={vaccinationCounts}
        />
      ),
    },
  ]
    .map((t) =>
      Object.assign(t, { path: `/tables/${t.name}`, link: `/tables/${t.name}` })
    )
    .filter(
      (t) =>
        !user ||
        !user.deidentifiedExport ||
        (user.deidentifiedExport && t.name !== "contact")
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
  participants?: Participant[]
  commonCols: any
}) {
  const columns = useMemo(
    () => [
      commonCols.pid,
      {
        Header: "Email",
        accessor: (p: ParticipantFull) => p.email,
        width: 400,
      },
      {
        Header: "Mobile",
        accessor: (p: ParticipantFull) => p.mobile,
        width: 120,
      },
      commonCols.site,
    ],
    [commonCols]
  )

  return <Table columns={columns} data={participants ?? []} />
}

function Baseline({
  participants,
  commonCols,
}: {
  participants?: ParticipantExtra[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [
      commonCols.pid,
      commonCols.date({ name: "dateScreening", header: "Screened" }),
      commonCols.date({ name: "dob", header: "DoB" }),
      {
        Header: "Age at recruitment",
        accessor: (p: ParticipantExtra) => round(p.ageRecruitment, 1),
        width: 150,
        filter: "between",
        Filter: NumberRangeColumnFilter,
      },
      {
        Header: "Height (cm)",
        accessor: (p: ParticipantExtra) => p.heightCM,
        width: 150,
        filter: "between",
        Filter: NumberRangeColumnFilter,
      },
      {
        Header: "Weight (kg)",
        accessor: (p: ParticipantExtra) => p.weightKG,
        width: 150,
        filter: "between",
        Filter: NumberRangeColumnFilter,
      },
      {
        Header: "BMI",
        accessor: (p: ParticipantExtra) => round(p.bmi),
        width: 150,
        filter: "between",
        Filter: NumberRangeColumnFilter,
      },
      {
        Header: "Gender",
        accessor: (p: Participant) => p.gender ?? "(missing)",
        width: 75,
        Filter: getSelectColumnFilter(
          Object.keys(GenderV.keys).concat(["(missing)"])
        ),
      },
      {
        Header: "Occupation",
        accessor: (p: ParticipantExtra) => p.occupation,
      },
      commonCols.site,
    ]
  }, [commonCols])

  return <Table columns={columns} data={participants ?? []} />
}

function ScheduleTable({
  schedule,
  commonCols,
}: {
  schedule?: Schedule[]
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

  return <Table columns={columns} data={schedule ?? []} />
}

function WeeklySurveyTable({
  weeklySurvey,
  commonCols,
}: {
  weeklySurvey?: WeeklySurvey[]
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

  return <Table columns={columns} data={weeklySurvey ?? []} />
}

function WeeklyCompletion({
  weeklySurvey,
  commonCols,
}: {
  weeklySurvey?: WeeklySurvey[]
  commonCols: any
}) {
  type WeeklyCompletion = {
    pid: string
    year: number
    weeks: number[]
  }

  const weeklyCompletion: WeeklyCompletion[] = []
  ;(weeklySurvey ?? [])
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
  vaccination?: Vaccination[]
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

  return <Table columns={columns} data={vaccination ?? []} />
}

function WithdrawnTable({
  withdrawn,
  commonCols,
}: {
  withdrawn?: Withdrawn[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [commonCols.pid, commonCols.date({ name: "date", header: "Date" })]
  }, [commonCols])

  return <Table columns={columns} data={withdrawn ?? []} />
}

function VirusTable({
  virus,
  commonCols,
}: {
  virus?: Virus[]
  commonCols: any
}) {
  const columns = useMemo(() => {
    return [
      {
        Header: "Name",
        accessor: (v: Virus) => v.name,
        width: 250,
      },
      {
        Header: "Short name",
        accessor: (v: Virus) => v.shortName,
        width: 200,
      },
      commonCols.clade("clade"),
    ]
  }, [commonCols])

  return <Table columns={columns} data={virus ?? []} />
}

function SerologyTable({
  serology,
  commonCols,
}: {
  serology?: SerologyExtra[]
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
        width: 250,
      },
      commonCols.clade("virusClade"),
      {
        Header: "Titre",
        accessor: "titre",
        filter: "exactText",
        width: 70,
      },
    ]
  }, [commonCols])

  return <Table columns={columns} data={serology ?? []} />
}

function renderSummarized(s: any) {
  if (!s || !s.kind) {
    return s
  }

  if (s.kind === "numeric") {
    return (
      <NumberInterval
        x={s.mean}
        low={s.min}
        high={s.max}
        format={(x) => Math.round(x).toString()}
      />
    )
  }
  if (s.kind === "logmean") {
    return (
      <NumberInterval
        x={s.mean}
        low={s.low}
        high={s.high}
        format={(x) => round(x, s.precision)}
      />
    )
  }
  if (s.kind === "count") {
    return `${s.n}`
  }
  if (s.kind === "proportion") {
    return (
      <NumberInterval
        x={s.prop}
        low={s.low}
        high={s.high}
        format={(x) => Math.round(x * 100) + "%"}
      />
    )
  }
  return "summarized"
}

function isPresent(x: any) {
  return x !== null && x !== undefined
}
function isPresentNumber(x: any) {
  return isPresent(x) && !isNaN(x)
}

function NumberInterval({
  x,
  low,
  high,
  format = (x) => x.toString(),
}: {
  x?: number | null
  low?: number | null
  high?: number | null
  format?: (x: number) => string | null
}) {
  const theme = useTheme()
  const conditionalFormat = (x: number | null | undefined) =>
    isPresentNumber(x) ? format(x!) : ""
  return (
    <div>
      <div>{conditionalFormat(x)}</div>{" "}
      <div style={{ color: theme.palette.text.secondary }}>
        {conditionalFormat(low)}-{conditionalFormat(high)}
      </div>
    </div>
  )
}

function Summary({
  participantsExtraFull,
  serologyFull,
  titreChangeFull,
  vaccinationCountsFull,
}: {
  participantsExtraFull?: ParticipantExtra[]
  serologyFull?: SerologyExtra[]
  titreChangeFull?: TitreChange[]
  vaccinationCountsFull?: VaccinationCount[]
}) {
  // Unique values for filters
  const viruses = unique(serologyFull?.map((s) => s.virus)).sort(stringSort)
  const vaccinations = unique(vaccinationCountsFull?.map((s) => s.count)).sort(
    numberSort
  )
  const uniqueSites = unique(participantsExtraFull?.map((p) => p.site)).sort(
    stringSort
  )

  // Filters
  const [selectedStudyYear, setSelectedStudyYear] = useState(STUDY_YEARS[0])
  const [selectedRecruitmentYears, setSelectedRecruitmentYears] = useState<
    number[]
  >([])
  const firstVirus = viruses[0]
  const [virusesSelected, setVirusesSelected] = useState<string[]>(
    firstVirus ? [firstVirus] : []
  )
  const [vacSelected, setVacSelected] = useState<number[]>([])
  const [splitVar, setSplitVar] = useState<"Site" | "Vaccinations">("Site")
  const [sitesSelected, setSitesSelected] = useState<Site[]>([])

  // Set the virus filter as soon as viruses are available - takes too long
  // otherwise
  useEffect(() => setVirusesSelected(firstVirus ? [firstVirus] : []), [
    firstVirus,
  ])

  // Apply filters

  const vaccinationCounts = vaccinationCountsFull?.filter(
    (p) =>
      p.upto === selectedStudyYear &&
      applyMultiFilter(
        selectedRecruitmentYears,
        p.dateScreening.getFullYear()
      ) &&
      applyMultiFilter(vacSelected, p.count) &&
      applyMultiFilter(sitesSelected, p.site)
  )
  // These PIDs will auto-filter recruitment year, site and previous vaccinations
  const availablePids = vaccinationCounts?.map((v) => v.pid)
  const participantsExtra = participantsExtraFull?.filter(
    (p) => !availablePids || availablePids.includes(p.pid)
  )
  const serology = serologyFull?.filter(
    (s) =>
      s.redcapProjectYear === selectedStudyYear &&
      (!availablePids || availablePids.includes(s.pid)) &&
      applyMultiFilter(virusesSelected, s.virus)
  )
  const titreChange = titreChangeFull?.filter(
    (p) =>
      p.year === selectedStudyYear &&
      (!availablePids || availablePids.includes(p.pid)) &&
      applyMultiFilter(virusesSelected, p.virus)
  )

  // Summarise the filtered data
  const countsBySite = rollup(
    participantsExtra ?? [],
    (d) => ({ site: d.site, split: d.site }),
    summariseCount
  )
  const countsByVac = rollup(
    vaccinationCounts ?? [],
    (d) => ({ prevVac: d.count, split: d.count }),
    summariseCount
  )
  const countsByGender = rollup(
    participantsExtra ?? [],
    (d) => ({ gender: d.gender }),
    summariseCount
  )
  const countsByOccupation = rollup(
    participantsExtra ?? [],
    (d) => ({ occupation: d.occupation }),
    summariseCount
  )
  const numericsBySplit = rollup(
    participantsExtra ?? [],
    (d) => ({
      split:
        splitVar === "Site"
          ? d.site
          : vaccinationCounts?.find((v) => v.pid === d.pid)?.count ?? -1,
    }),
    (v) => ({
      age: summariseNumeric(v.map((v) => v.ageRecruitment)),
      height: summariseNumeric(v.map((v) => v.heightCM)),
      weight: summariseNumeric(v.map((v) => v.weightKG)),
      bmi: summariseNumeric(v.map((v) => v.bmi)),
    })
  )
  const gmtByVirusDaySplit = rollup(
    serology ?? [],
    (d) => ({
      virus: d.virus,
      day: d.day,
      split:
        splitVar === "Site"
          ? d.site
          : vaccinationCounts?.find((v) => v.pid === d.pid)?.count ?? -1,
    }),
    (v) =>
      summariseLogmean(
        v.map((v) => v.titre),
        0
      )
  )
  const gmtByVirusDay = rollup(
    serology ?? [],
    (d) => ({ virus: d.virus, day: d.day }),
    (v) =>
      summariseLogmean(
        v.map((v) => v.titre),
        0
      )
  )
  const gmrByVirusSplit = rollup(
    titreChange ?? [],
    (d) => ({
      virus: d.virus,
      split:
        splitVar === "Site"
          ? d.site
          : vaccinationCounts?.find((v) => v.pid === d.pid)?.count ?? -1,
    }),
    (v) =>
      summariseLogmean(
        v.map((d) => d.rise),
        1
      )
  )
  const gmrByVirus = rollup(
    titreChange ?? [],
    (d) => ({ virus: d.virus }),
    (v) =>
      summariseLogmean(
        v.map((d) => d.rise),
        1
      )
  )
  const countsByGenderSplit = rollup(
    participantsExtra ?? [],
    (d) => ({
      gender: d.gender,
      split:
        splitVar === "Site"
          ? d.site
          : vaccinationCounts?.find((v) => v.pid === d.pid)?.count ?? -1,
    }),
    summariseCount
  )
  const countsByOccupationSplit = rollup(
    participantsExtra ?? [],
    (d) => ({
      occupation: d.occupation,
      split:
        splitVar === "Site"
          ? d.site
          : vaccinationCounts?.find((v) => v.pid === d.pid)?.count ?? -1,
    }),
    summariseCount
  )
  const countsByVacSite = rollup(
    vaccinationCounts ?? [],
    (d) => ({
      prevVac: d.count,
      site: d.site,
      split: splitVar === "Site" ? d.site : d.count,
    }),
    summariseCount
  )
  const seroconvByVirusSplit = rollup(
    titreChange ?? [],
    (d) => ({
      virus: d.virus,
      split:
        splitVar === "Site"
          ? d.site
          : vaccinationCounts?.find((v) => v.pid === d.pid)?.count ?? -1,
    }),
    (v) => summariseProportion(v.map((x) => x.seroconverted))
  )
  const seroconvByVirus = rollup(
    titreChange ?? [],
    (d) => ({ virus: d.virus }),
    (v) => summariseProportion(v.map((x) => x.seroconverted))
  )

  // Convert the summaries above to the appropriate table

  /**Assume only one row is needed in the output */
  function widenSplit<T extends { split: Site | number }>(data: T[]) {
    return data.reduce(
      (acc, x) => Object.assign(acc, { [x.split]: x }),
      {} as { [k: string]: any }
    )
  }
  function genNumericRow(
    label: string,
    accessorParticpant: (p: ParticipantExtra) => number | null,
    accessorSummary: (x: any) => Object
  ): Row {
    return {
      label: <RowLabel label={label} top="median" bottom="min-max" />,
      total: summariseNumeric(participantsExtra?.map(accessorParticpant) ?? []),
      ...widenSplit(
        numericsBySplit.map((x) => ({ split: x.split, ...accessorSummary(x) }))
      ),
    } as Row
  }

  type Row = {
    label?: string | number | ReactNode
    total?: any
  }

  const numericRows = [
    genNumericRow(
      "Age at recruitment",
      (p) => p.ageRecruitment,
      (x) => x.age
    ),
    genNumericRow(
      "Height",
      (p) => p.heightCM,
      (x) => x.height
    ),
    genNumericRow(
      "Weight",
      (p) => p.weightKG,
      (x) => x.weight
    ),
    genNumericRow(
      "BMI",
      (p) => p.bmi,
      (x) => x.bmi
    ),
  ]

  const bottomRow = {
    label: <RowLabel label="Total count" top="" bottom="" />,
    total: summariseCount(participantsExtra ?? []),
    ...(splitVar === "Site"
      ? widenSplit(countsBySite)
      : widenSplit(countsByVac)),
  }

  function genEmptyRow(
    label: string | number,
    top: string,
    bottom: string
  ): Row[] {
    return [{ label: <RowLabel label={label} top={top} bottom={bottom} /> }]
  }

  const countsByVacSiteWithMarginal = rollup(
    countsByVacSite,
    (d) => ({ keep: splitVar === "Site" ? d.prevVac : d.site }),
    (v, k) => ({
      label: toTitleCase(k.keep.toString()),
      total:
        splitVar === "Site"
          ? countsByVac.find((c) => c.prevVac === k.keep)
          : countsBySite.find((x) => x.site === k.keep),
      ...widenSplit(v),
    })
  ).sort((a, b) => stringSort(a.label, b.label))

  const countsByGenderSiteWithMarginal = rollup(
    countsByGenderSplit,
    (d) => ({ gender: d.gender }),
    (v, k) => ({
      label: k.gender ?? "(missing)",
      total: countsByGender.find((c) => c.gender === k.gender),
      ...widenSplit(v),
    })
  ).sort((a, b) => stringSort(a.label, b.label))

  const countsByOccupationSplitWithMarginal = rollup(
    countsByOccupationSplit,
    (d) => ({ occupation: d.occupation }),
    (v, k) => ({
      label: k.occupation ?? "(missing)",
      total: countsByOccupation.find((c) => c.occupation === k.occupation),
      ...widenSplit(v),
    })
  ).sort((a, b) => stringSort(a.label, b.label))

  const gmtByVirusDaySiteWithMarginal = rollup(
    gmtByVirusDaySplit,
    (d) => ({ virus: d.virus, day: d.day }),
    (v, k) => ({
      label: k.day,
      total: gmtByVirusDay.find((c) => c.virus === k.virus && c.day === k.day),
      ...widenSplit(v),
    })
  )
    .sort((a, b) => numberSort(a.day, b.day))
    .sort((a, b) => stringSort(a.virus, b.virus))

  // Insert label rows for each virus
  const virusBreaks = findBreaks(
    gmtByVirusDaySiteWithMarginal.map((x) => x.virus)
  )
  virusBreaks.forEach((b, i) =>
    insertInPlace(
      gmtByVirusDaySiteWithMarginal,
      b.index + i,
      genEmptyRow(b.value, "", "")[0] as any
    )
  )

  const gmrByVirusSiteWithMarginal = rollup(
    gmrByVirusSplit,
    (d) => ({ virus: d.virus }),
    (v, k) => ({
      label: k.virus,
      total: gmrByVirus.find((c) => c.virus === k.virus),
      ...widenSplit(v),
    })
  ).sort((a, b) => stringSort(a.label, b.label))

  const seroconvByVirusSiteWithMarginal = rollup(
    seroconvByVirusSplit,
    (d) => ({ virus: d.virus }),
    (v, k) => ({
      label: k.virus,
      total: seroconvByVirus.find((c) => c.virus === k.virus),
      ...widenSplit(v),
    })
  ).sort((a, b) => stringSort(a.label, b.label))

  const counts = genEmptyRow("GMT", "mean", "95% CI")
    .concat(gmtByVirusDaySiteWithMarginal)
    .concat(genEmptyRow("GMR (14 vs 0)", "mean", "95% CI"))
    .concat(gmrByVirusSiteWithMarginal)
    .concat(genEmptyRow("Seroconversion (14 vs 0)", "proportion", "95% CI"))
    .concat(seroconvByVirusSiteWithMarginal)
    .concat(numericRows)
    .concat(
      genEmptyRow(splitVar === "Site" ? "Vaccinations count" : "Site", "", "")
    )
    .concat(countsByVacSiteWithMarginal)
    .concat(genEmptyRow("Gender count", "", ""))
    .concat(countsByGenderSiteWithMarginal)
    .concat(genEmptyRow("Occupation count", "", ""))
    .concat(countsByOccupationSplitWithMarginal)
    .concat(bottomRow)

  const splitSelected =
    splitVar === "Site"
      ? sitesSelected.length === 0
        ? uniqueSites
        : sitesSelected
      : vacSelected.length === 0
      ? vaccinations.map((x) => x.toString())
      : vacSelected.map((x) => x.toString())
  const columns = useMemo(() => {
    return [
      {
        Header: "",
        id: "var",
        accessor: (p: any) => p.label,
        width: 150,
      },
      {
        Header: splitVar,
        id: "overhead",
        columns: splitSelected.map((s) => ({
          Header: splitVar === "Site" ? toTitleCase(s) : s,
          id: s,
          accessor: (p: any) => renderSummarized(p[s]),
          width: 100,
        })),
      },
      {
        Header: "Total",
        accessor: (p: any) => renderSummarized(p.total),
        width: 100,
      },
    ]
  }, [splitVar, splitSelected])

  return (
    <div>
      <ControlRibbon>
        <StudyYearSelector
          label="Serology year"
          value={selectedStudyYear}
          onChange={(x) => setSelectedStudyYear(x ?? STUDY_YEARS[0])}
          disableClearable
        />
        <StudyYearSelectorMultiple
          label="Recruited in"
          value={selectedRecruitmentYears}
          onChange={setSelectedRecruitmentYears}
        />
        <SelectorMultiple
          options={viruses}
          label="Virus"
          width={200}
          value={virusesSelected}
          onChange={(n) => setVirusesSelected(n)}
          inputMode="none"
        />
        <Selector
          options={["Site", "Vaccinations"] as ("Site" | "Vaccinations")[]}
          label="Split"
          width={150}
          value={splitVar}
          onChange={(n) => setSplitVar(n ?? "Site")}
          inputMode="none"
          disableClearable
        />
        <SelectorMultiple
          options={vaccinations}
          label="Vaccinations"
          value={vacSelected}
          width={150}
          onChange={(n) => setVacSelected(n)}
          inputMode="none"
        />
        <SiteSelect
          site={sitesSelected}
          sites={uniqueSites}
          setSite={setSitesSelected}
        />
      </ControlRibbon>
      <SummaryTable
        columns={columns}
        data={counts}
        overheadColumnId="overhead"
        isLabelRow={(r) => (r.label ? typeof r.label === "object" : false)}
        maxWidth={
          150 + // Label column
          16 * 2 + // Padding on label column
          100 + // Total
          detectScrollbarWidth() + // Vertical one
          100 * splitSelected.length // What we split by
        }
      />
    </div>
  )
}

function RowLabel({
  label,
  top,
  bottom,
}: {
  label: string | number
  top: string
  bottom: string
}) {
  const theme = useTheme()
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        whiteSpace: "pre",
        maxWidth: 150,
      }}
    >
      <div style={{ marginRight: 10 }}>{label}</div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div>{top}</div>
        <div style={{ color: theme.palette.text.secondary }}>{bottom}</div>
      </div>
    </div>
  )
}

function SummaryTable<T extends object>({
  columns,
  data,
  overheadColumnId,
  isLabelRow,
  maxWidth,
}: {
  columns: Column<T>[]
  data: T[]
  overheadColumnId: string
  isLabelRow: (t: T) => boolean
  maxWidth: number
}) {
  const table = useTable({ columns, data })
  const classes = useStyles()
  const windowSize = useWindowSize()
  return (
    <TableContainer
      className={classes.summaryTable}
      style={{
        height: windowSize.height - 50 - 50 - 56 - detectScrollbarWidth(),
        maxWidth,
      }}
    >
      <MaterialTable {...table.getTableProps()} stickyHeader>
        <TableHead>
          {table.headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((h) => (
                <TableCell
                  {...h.getHeaderProps()}
                  className={
                    h.id === `${overheadColumnId}_1` ? "site-overhead" : ""
                  }
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
      initialState: {
        sortBy: [{ id: "pid" }],
      },
    },
    useBlockLayout,
    useFilters,
    useSortBy
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
                <div className="clickable" {...h.getSortByToggleProps()}>
                  <div className={classes.columnName + " name"}>
                    {h.render("Header")}
                  </div>
                  <div className={"sort"}>
                    {h.isSorted ? (
                      h.isSortedDesc ? (
                        <Icon icon={sortDownIcon} />
                      ) : (
                        <Icon icon={sortUpIcon} />
                      )
                    ) : (
                      <Icon icon={sortIcon} />
                    )}
                  </div>
                </div>
                <div>{h.render("Filter")}</div>
              </div>
            </div>
          ))}
        </div>
        {/*Body*/}
        <div {...table.getTableBodyProps()} className="body">
          <FixedSizeList
            height={windowSize.height - 50 - 50 - 70 - detectScrollbarWidth()}
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

function DateRangeColumnFilter<T extends Object>({
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

function NumberRangeColumnFilter<T extends Object>({
  column: { setFilter },
}: FilterProps<T>) {
  const [lowvalue, setLowvalue] = useState<number | null>(null)
  const [highvalue, setHighvalue] = useState<number | null>(null)
  const classes = useStyles()
  return (
    <div className={classes.numberFilter}>
      <TextField
        value={lowvalue === null ? "" : lowvalue}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          setLowvalue(isNaN(v) ? null : v)
          setFilter((old = []) => [isNaN(v) ? undefined : v, old[1]])
        }}
        placeholder="from"
        style={{ marginRight: 5 }}
      />
      -
      <TextField
        value={highvalue === null ? "" : highvalue}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          setHighvalue(isNaN(v) ? null : v)
          setFilter((old = []) => [old[0], isNaN(v) ? undefined : v])
        }}
        placeholder="to"
        style={{ marginLeft: 5 }}
      />
    </div>
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
