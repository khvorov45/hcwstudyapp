import { isDate } from "moment"

export function toCSV(data: Object[]) {
  const headers = Object.keys(data[0]).join(",")
  return (
    headers +
    "\n" +
    data
      .map((e) =>
        Object.values(e)
          .map((x) => (isDate(x) ? x.toISOString().slice(0, 10) : x))
          .join(",")
      )
      .join("\n")
  )
}
