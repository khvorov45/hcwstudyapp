import { StatusCodes } from "http-status-codes"
import { useAsync } from "react-async-hook"
import * as t from "io-ts"
import { apiReq } from "../lib/api"
import { User, UserV } from "../lib/data"
import { useMemo } from "react"
import { Table } from "./tables"

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

  return <Table data={users} columns={columns} />
}
