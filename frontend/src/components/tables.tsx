import { Redirect, Route } from "react-router-dom"
import { SimpleNav } from "./nav"

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
      <Route path={tablePaths[0]}>Contact</Route>
      <Route path={tablePaths[1]}>Baseline</Route>
      <Route path={tablePaths[2]}>Schedule</Route>
      <Route path={tablePaths[3]}>Weekly survey</Route>
      <Route path={tablePaths[4]}>Weekly completion</Route>
      <Route path={tablePaths[5]}>Summary</Route>
    </>
  )
}
