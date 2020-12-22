import { useAsync } from "react-async-hook"
import swagger from "@apidevtools/swagger-parser"
import { makeStyles, Theme, createStyles } from "@material-ui/core"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    api: {
      padding: 20,
    },
  })
)

export default function ApiSpec() {
  const apiSpec = useAsync(async () => {
    return await swagger.dereference(
      "https://raw.githubusercontent.com/khvorov45/hcwstudyapp/split-backend-frontend/backend/hcwstudyapp-openapi.yml"
    )
  }, [])
  console.log(apiSpec.result)
  console.log(apiSpec.error?.message)
  const classes = useStyles()
  if (!apiSpec.result) {
    return <></>
  }
  return (
    <div className={classes.api}>
      <h1>{apiSpec.result.info.title}</h1>
      {Object.entries(apiSpec.result.paths).map(
        ([path, pathEntries]: [path: string, pathEntries: any]) => {
          return Object.entries(pathEntries).map(([method, methodEntries]) => (
            <Path
              key={path + method}
              method={method}
              path={path}
              params={methodEntries}
            />
          ))
        }
      )}
    </div>
  )
}

function Path({
  method,
  path,
  params,
}: {
  method: string
  path: string
  params: any
}) {
  return (
    <div>
      <h2>{`${method.toUpperCase()} ${path}`}</h2>
    </div>
  )
}
