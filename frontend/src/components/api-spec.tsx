import { useAsync } from "react-async-hook"
import swagger from "@apidevtools/swagger-parser"
import { makeStyles, Theme, createStyles } from "@material-ui/core"
import { NamedDivider } from "./divider"
import { API_SPEC_FILEPATH } from "../lib/config"
import { Link } from "react-router-dom"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    api: {
      padding: 20,
    },
    pathCard: {
      padding: 10,
      "& pre": {
        marginTop: 0,
      },
    },
    pathHeader: {
      fontSize: "large",
      "&>span": {
        paddingRight: 10,
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
    subtitle: {
      fontSize: "medium",
      fontWeight: "bold",
    },
    subContent: {
      paddingLeft: 10,
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
    security: {
      "&>span": {
        paddingRight: 5,
      },
    },
    sectionSep: {
      fontSize: "large",
      textTransform: "uppercase",
      fontWeight: "bold",
    },
  })
)

export default function ApiSpec() {
  const apiSpec = useAsync(async () => {
    return await swagger.dereference(API_SPEC_FILEPATH)
  }, [])
  const breaks = [
    { path: "/auth/token/send", title: "Auth" },
    { path: "/users", title: "Users" },
    { path: "/participants", title: "Participants" },
  ]
  const classes = useStyles()
  if (!apiSpec.result) {
    return <></>
  }
  return (
    <div className={classes.api}>
      <h1>{apiSpec.result.info.title}</h1>
      {Object.entries(apiSpec.result.paths).map(
        ([path, pathEntries]: [path: string, pathEntries: any]) => {
          const title = breaks.find((b) => b.path === path)?.title
          return (
            <div key={path}>
              {title && (
                <NamedDivider
                  className={classes.sectionSep}
                  key={title}
                  name={title}
                />
              )}
              {Object.entries(pathEntries).map(([method, methodEntries]) => (
                <Path
                  key={method}
                  method={method}
                  path={path}
                  params={methodEntries}
                />
              ))}
            </div>
          )
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
      <div className={classes.subContent}>
        {params.security && <Security security={params.security} />}
        {params.requestBody && <RequestBody body={params.requestBody} />}
        {params.parameters && <Parameters parameters={params.parameters} />}
        <div className={classes.responsesTitle}>Responses:</div>
        <div className={classes.subContent}>
          {Object.entries(params.responses).map(([code, codeParams]) => (
            <ResponseCode key={code} code={code} params={codeParams} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Parameters({ parameters }: { parameters: any }) {
  const classes = useStyles()
  return (
    <div>
      <span className={classes.subtitle}>Query:</span>
      <span className={classes.subContent}>
        <code>
          {parameters
            .map((p: any) => `${p.name}=${stringifySchema(p.schema, 0)}`)
            .join(" ")}
        </code>
      </span>
    </div>
  )
}

function Security({ security }: { security: any }) {
  const classes = useStyles()
  return (
    <div className={classes.security}>
      <span className={classes.subtitle}>Authorization header:</span>
      <span>
        <code>
          {security.map((s: Object) =>
            Object.keys(s).map((k) => (
              <span>
                Bearer <Link to="get-link">token ({k})</Link>
              </span>
            ))
          )}
        </code>
      </span>
    </div>
  )
}

function RequestBody({ body }: { body: any }) {
  const classes = useStyles()
  return (
    <div>
      <div className={classes.subtitle}>Request body:</div>
      <div className={classes.subContent}>
        {Object.entries(body.content).map(([type, params]) => (
          <Content key={type} type={type} params={params} />
        ))}
      </div>
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
      <div className={classes.subContent}>
        {params.content &&
          Object.entries(params.content).map(([type, typeParams]) => (
            <Content key={type} type={type} params={typeParams} />
          ))}
      </div>
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
      : schema.type === "object"
      ? stringifyObject(schema.properties, indentLevel)
      : stringifyType(schema, indentLevel)
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
  return `${sep}${name}: ${stringifyType(params, indentLevel)}`
}

function stringifyType(
  params: {
    type: string
    enum?: string[]
    nullable?: boolean
    format?: string
  },
  indentLevel: number
): string {
  const sep = "  ".repeat(indentLevel)
  return `${
    params.enum
      ? params.enum.map((e: string) => `"${e}"`).join(`\n${sep} | `)
      : params.type
  }${params.nullable ? " | null" : ""}${
    params.format ? ` [${params.format}]` : ""
  }`
}
