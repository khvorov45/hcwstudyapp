import { StatusCodes } from "http-status-codes"
import { useAsync } from "react-async-hook"
import * as t from "io-ts"
import { apiReq } from "../lib/api"
import { User, UserV } from "../lib/data"
import React, { useMemo } from "react"
import { useTable } from "react-table"
import {
  createStyles,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
} from "@material-ui/core"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    tableContainer: {
      maxWidth: 500,
      margin: "auto",
      "& th": {
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      },
      "& th:first-child": {
        borderLeft: `1px solid ${theme.palette.divider}`,
      },
      "& td": {
        borderBottom: "none",
      },
      "& tr:nth-child(even)": {
        background: theme.palette.background.alt,
      },
    },
  })
)

export default function Users({ token }: { token?: string }) {
  const usersFetch = useAsync(
    () =>
      apiReq({
        method: "GET",
        path: "users",
        token: token,
        success: StatusCodes.OK,
        failure: [StatusCodes.UNAUTHORIZED],
        validator: t.array(UserV),
      }),
    []
  )
  const users = useMemo(() => usersFetch.result ?? [], [usersFetch])
  const columns = useMemo(() => {
    return [
      {
        Header: "Email",
        accessor: (u: User) => u.email,
        width: 400,
      },
      {
        Header: "Access",
        accessor: (u: User) => u.accessGroup,
        width: 100,
      },
    ]
  }, [])

  const table = useTable<User>({
    columns: columns,
    data: users,
  })
  const classes = useStyles()
  return (
    <TableContainer className={classes.tableContainer}>
      <Table {...table.getTableProps()}>
        <TableHead>
          <TableRow>
            {table.headers.map((c) => (
              <TableCell {...c.getHeaderProps()}>
                {c.render("Header")}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody {...table.getTableBodyProps}>
          {table.rows.map((row, i) => {
            table.prepareRow(row)
            return (
              <TableRow {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <TableCell {...cell.getCellProps()}>
                      {cell.render("Cell")}
                    </TableCell>
                  )
                })}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
