import { useMemo } from "react"
import * as t from "io-ts"
import { apiReq, TableName } from "./api"
import { StatusCodes } from "http-status-codes"

export type TableSettings = {
  withdrawn?: { setting: "yes" | "no" | "any"; ids: string[] }
}

export function useTableDataPlain<T>(data: T[] | undefined) {
  return useMemo(() => data ?? [], [data])
}

export function useTableData<T extends { pid: string }>(
  data: T[] | undefined,
  settings: TableSettings
) {
  if (settings.withdrawn && settings.withdrawn.setting !== "any") {
    return data?.filter(
      (r) =>
        settings.withdrawn?.ids.includes(r.pid) ===
        (settings.withdrawn?.setting === "yes")
    )
  }
  return data
}

export async function tableFetch<T>(
  name: TableName,
  validator: t.Type<T, unknown, any>,
  token?: string
) {
  if (!token) {
    return []
  }
  return await apiReq({
    method: "GET",
    path: name,
    token: token,
    success: StatusCodes.OK,
    failure: [StatusCodes.UNAUTHORIZED],
    validator: t.array(validator),
  })
}
