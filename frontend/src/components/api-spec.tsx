import { useAsync } from "react-async-hook"
import swagger from "@apidevtools/swagger-parser"
import { makeStyles, Theme, createStyles } from "@material-ui/core"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    api: {
      padding: 20,
    },
    pathCard: {
      padding: 10,
    },
    pathHeader: {
      fontSize: "large",
      "&>span": {
        paddingLeft: 5,
        paddingRight: 5,
      },
    },
    method: {
      fontWeight: "bold",
    },
    path: {
      fontFamily: "monospace",
      fontSize: "x-large",
    },
    summary: {
      color: theme.palette.text.secondary,
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
  const classes = useStyles()
  return (
    <div className={classes.pathCard}>
      <div className={classes.pathHeader}>
        <span className={classes.method}>{method.toUpperCase()}</span>
        <span className={classes.path}>{path}</span>
        <span className={classes.summary}>{params.summary}</span>
      </div>
    </div>
  )
}
