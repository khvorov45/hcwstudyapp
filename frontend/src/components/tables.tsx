import { Redirect, Route } from "react-router-dom"
import StatusCodes from "http-status-codes"
import * as t from "io-ts"
import { SimpleNav } from "./nav"
import { useAsync } from "react-async-hook"
import { apiReq } from "../lib/api"
import { Participant, ParticipantV } from "../lib/data"
import { useMemo } from "react"
import { Column, useTable } from "react-table"
import {
  Table as MaterialTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core"

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
  const table = useTable<T>({
    columns: columns,
    data: data,
  })
  return (
    <>
      <TableContainer>
        <MaterialTable {...table.getTableProps()}>
          <TableHead>
            <TableRow>
              {table.headers.map((h) => (
                <TableCell {...h.getHeaderProps()}>
                  {h.render("Header")}
                </TableCell>
              ))}
            </TableRow>
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
    </>
  )
}
