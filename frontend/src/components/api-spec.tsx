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
        paddingRight: 10,
      },
    },
    pathContent: {
      paddingLeft: 10,
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
    responsesTitle: {
      fontSize: "medium",
      fontWeight: "bold",
      paddingBottom: 5,
    },
    responseHeader: {
      paddingBottom: 5,
      "&>span": {
        paddingRight: 5,
      },
    },
    responseCode: {
      fontFamily: "monospace",
    },
    responseDescription: {
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
      <div className={classes.pathContent}>
        {params.requestBody && <RequestBody body={params.requestBody} />}
        <div className={classes.responsesTitle}>Responses:</div>
        <div>
          {Object.entries(params.responses).map(([code, codeParams]) => (
            <ResponseCode key={code} code={code} params={codeParams} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RequestBody({ body }: { body: any }) {
  const classes = useStyles()
  return (
    <div>
      <div className={classes.responsesTitle}>Request body:</div>
      {Object.entries(body.content).map(([type, params]) => (
        <Content key={type} type={type} params={params} />
      ))}
    </div>
  )
}

function ResponseCode({ code, params }: { code: string; params: any }) {
  const classes = useStyles()
  return (
    <div>
      <div className={classes.responseHeader}>
        <span className={classes.responseCode}>{code}</span>
        <span className={classes.responseDescription}>
          {params.description}
        </span>
      </div>
      {params.content &&
        Object.entries(params.content).map(([type, typeParams]) => (
          <Content key={type} type={type} params={typeParams} />
        ))}
    </div>
  )
}

function Content({ type, params }: { type: string; params: any }) {
  return (
    <div>
      <code>{type}</code>
      <pre>
        <code>{stringifySchema(params.schema, 0)}</code>
      </pre>
    </div>
  )
}

function stringifySchema(schema: any, indentLevel: number): string {
  return `${
    schema.type === "array"
      ? stringifyArray(schema.items, indentLevel)
      : stringifyObject(schema.properties, indentLevel)
  }`
}

function stringifyArray(items: any, indentLevel: number): string {
  const sep = "  ".repeat(indentLevel)
  return `${sep}[\n${stringifySchema(items, indentLevel + 1)}\n${sep}]`
}

function stringifyObject(properties: any, indentLevel: number): string {
  const sep = "  ".repeat(indentLevel)
  const entries = Object.entries(properties)
    .map(([name, params]) => stringifyProperty(name, params, indentLevel + 1))
    .join("\n")
  return `${sep}{\n${entries}\n${sep}}`
}

function stringifyProperty(
  name: string,
  params: any,
  indentLevel: number
): string {
  const sep = "  ".repeat(indentLevel)
  return `${sep}${name}: ${
    params.type ?? params.enum.map((e: string) => `"${e}"`).join(" | ")
  }`
}
