import { Redirect, Route } from "react-router-dom"
import StatusCodes from "http-status-codes"
import * as t from "io-ts"
import { SimpleNav } from "./nav"
import { useAsync } from "react-async-hook"
import { apiReq } from "../lib/api"
import { ParticipantV } from "../lib/data"

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
  return (
    <>
      <SimpleNav links={tableNamedLinks} />
      <Route path={"/tables"}>
        <Redirect to={tableLinks[0]} />
      </Route>
      <Route path={tablePaths[0]}>
        <Contact token={token} />
      </Route>
      <Route path={tablePaths[1]}>Baseline</Route>
      <Route path={tablePaths[2]}>Schedule</Route>
      <Route path={tablePaths[3]}>Weekly survey</Route>
      <Route path={tablePaths[4]}>Weekly completion</Route>
      <Route path={tablePaths[5]}>Summary</Route>
    </>
  )
}

function Contact({ token }: { token: string | null }) {
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
  console.log(participantsFetch.result)
  console.log(participantsFetch.error?.message)
  return <>Contact</>
}
