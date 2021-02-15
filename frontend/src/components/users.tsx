import { StatusCodes } from "http-status-codes"
import { useAsyncCallback } from "react-async-hook"
import * as t from "io-ts"
import { apiReq } from "../lib/api"
import { AccessGroup, AccessGroupV, User } from "../lib/data"
import React, { useMemo, useState } from "react"
import { useTable } from "react-table"
import {
  createStyles,
  IconButton,
  makeStyles,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Theme,
} from "@material-ui/core"
import Edit from "@material-ui/icons/Edit"
import Check from "@material-ui/icons/Check"
import { ButtonArray } from "./button"
import ScreenHeight from "./screen-height"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    tableContainer: {
      maxWidth: 650,
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
        paddingTop: 0,
        paddingBottom: 0,
      },
      "& tr:nth-child(even)": {
        background: theme.palette.background.alt,
      },
    },
  })
)

export default function Users({
  token,
  users,
  onEdit,
}: {
  token?: string
  users: User[]
  onEdit: () => void
}) {
  const updateUser = useAsyncCallback(() =>
    apiReq({
      method: "PUT",
      path: "users",
      token: token,
      success: StatusCodes.NO_CONTENT,
      failure: [StatusCodes.UNAUTHORIZED],
      validator: t.void,
      body: {
        email: editedEmail,
        accessGroup: editedAccess,
        deidentifiedExport: editedDeidentify,
      },
    })
  )

  const [editedIndex, setEditedIndex] = useState<number | null>(null)
  const [editedAccess, setEditedAccess] = useState<AccessGroup>("admin")
  const [editedEmail, setEditedEmail] = useState("")
  const [editedDeidentify, setEditedDeidentify] = useState(false)
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
        Cell: ({
          index,
          editedIndex,
          accessGroup,
          editedAccess,
        }: {
          index: number
          editedIndex: number
          accessGroup: AccessGroup
          editedAccess: AccessGroup
        }) => {
          if (index === editedIndex) {
            return (
              <AccessGroupSelector
                value={editedAccess}
                onChange={setEditedAccess}
              />
            )
          }
          return accessGroup
        },
      },
      {
        Header: "Deidentify",
        accessor: (u: User) => u.deidentifiedExport.toString(),
        width: 150,
        Cell: ({
          index,
          editedIndex,
          deidentify,
          editedDeidentify,
        }: {
          index: number
          editedIndex: number
          deidentify: boolean
          editedDeidentify: boolean
        }) => {
          if (index === editedIndex) {
            return (
              <BooleanSelector
                value={editedDeidentify}
                onChange={setEditedDeidentify}
              />
            )
          }
          return deidentify.toString()
        },
      },
    ]
  }, [])

  const table = useTable<User>({
    columns: columns,
    data: users,
  })

  const classes = useStyles()
  return (
    <ScreenHeight heightTaken={50}>
      <TableContainer className={classes.tableContainer}>
        <Table {...table.getTableProps()}>
          <TableHead>
            <TableRow>
              {table.headers.map((c) => (
                <TableCell {...c.getHeaderProps()}>
                  {c.render("Header")}
                </TableCell>
              ))}
              <TableCell>Actions</TableCell>
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
                        {cell.render("Cell", {
                          index: i,
                          editedIndex,
                          accessGroup: row.original.accessGroup,
                          editedAccess,
                          deidentify: row.original.deidentifiedExport,
                          editedDeidentify,
                        })}
                      </TableCell>
                    )
                  })}
                  <TableCell>
                    <ButtonArray>
                      <IconButton
                        onClick={() => {
                          setEditedIndex((old) => (old === i ? null : i))
                          setEditedEmail(row.original.email)
                          setEditedAccess(row.original.accessGroup)
                          setEditedDeidentify(row.original.deidentifiedExport)
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          updateUser
                            .execute()
                            .then(() => {
                              setEditedIndex(null)
                              onEdit()
                            })
                            .catch((e) => console.error(e))
                        }
                        disabled={i !== editedIndex || updateUser.loading}
                      >
                        <Check />
                      </IconButton>
                    </ButtonArray>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </ScreenHeight>
  )
}

function AccessGroupSelector({
  value,
  onChange,
}: {
  value: AccessGroup
  onChange: (a: AccessGroup) => void
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value as AccessGroup)}
    >
      {Object.keys(AccessGroupV.keys).map((a) => (
        <MenuItem key={a} value={a}>
          {a}
        </MenuItem>
      ))}
    </Select>
  )
}

function BooleanSelector({
  value,
  onChange,
}: {
  value: boolean
  onChange: (a: boolean) => void
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value === "true")}>
      <MenuItem value={"true"}>true</MenuItem>
      <MenuItem value={"false"}>false</MenuItem>
    </Select>
  )
}
