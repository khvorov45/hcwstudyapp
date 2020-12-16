import { Redirect, Route } from "react-router-dom"
import StatusCodes from "http-status-codes"
import * as t from "io-ts"
import { SimpleNav } from "./nav"
import { useAsync } from "react-async-hook"
import { apiReq } from "../lib/api"
import { Participant, ParticipantV } from "../lib/data"
import { CSSProperties, useMemo } from "react"
import { Column, useBlockLayout, useTable } from "react-table"
import { FixedSizeList } from "react-window"
import { makeStyles, Theme, createStyles } from "@material-ui/core"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    table: {
      display: "inline-block",
      borderSpacing: 0,
      border: "1px solid black",

      "& .tr": {
        ":last-child": {
          ".td": {
            borderBottom: 0,
          },
        },
      },

      "& .th, & .td": {
        margin: 0,
        padding: "0.5rem",
        borderBottom: "1px solid black",
        borderRight: "1px solid black",

        "&:last-child": {
          borderRight: "1px solid black",
        },
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
        url: "http://localhost:7001/participants",
        token: token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: t.array(ParticipantV),
      }),
    []
  )

  const participants = useMemo(() => participantsFetch.result ?? [], [
    participantsFetch,
  ])

  return (
    <>
      <SimpleNav links={tableNamedLinks} />
      <Route path={"/tables"}>
        <Redirect to={tableLinks[0]} />
      </Route>
      <Route path={tablePaths[0]}>
        <Contact participants={participants} />
      </Route>
      <Route path={tablePaths[1]}>
        <Baseline participants={participants} />
      </Route>
      <Route path={tablePaths[2]}>Schedule</Route>
      <Route path={tablePaths[3]}>Weekly survey</Route>
      <Route path={tablePaths[4]}>Weekly completion</Route>
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
      },
      {
        Header: "Email",
        accessor: (p: Participant) => p.email,
      },
      {
        Header: "Mobile",
        accessor: (p: Participant) => p.mobile,
      },
      {
        Header: "Screened",
        accessor: (p: Participant) => formatDate(p.dateScreening),
      },
      {
        Header: "Site",
        accessor: (p: Participant) => p.site,
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
      },
      {
        Header: "DoB",
        accessor: (p: Participant) => formatDate(p.dob),
      },
      {
        Header: "Gender",
        accessor: (p: Participant) => p.gender,
      },
      {
        Header: "Site",
        accessor: (p: Participant) => p.site,
      },
    ]
  }, [])

  return <Table columns={columns} data={participants} />
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
      <div {...r.getRowProps({ style })} className="tr">
        {r.cells.map((c) => (
          <div {...c.getCellProps()} className="td">
            {c.render("Cell")}
          </div>
        ))}
      </div>
    )
  }
  const classes = useStyles()
  return (
    <div {...table.getTableProps()} className={classes.table}>
      {/*Headers*/}
      <div>
        {table.headers.map((h) => (
          <div {...h.getHeaderProps()} className="th">
            {h.render("Header")}
          </div>
        ))}
      </div>
      {/*Body*/}
      <div {...table.getTableBodyProps()}>
        <FixedSizeList
          height={500}
          itemCount={table.rows.length}
          itemSize={35}
          width={table.totalColumnsWidth + 5}
        >
          {renderRow}
        </FixedSizeList>
      </div>
    </div>
  )
}
