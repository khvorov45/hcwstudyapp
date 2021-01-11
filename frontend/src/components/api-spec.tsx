import { useAsync } from "react-async-hook"
import swagger from "@apidevtools/swagger-parser"
import {
  makeStyles,
  Theme,
  createStyles,
  Link as MaterialLink,
  useTheme,
} from "@material-ui/core"
import { NamedDivider } from "./divider"
import { API_ROOT, API_SPEC_FILEPATH } from "../lib/config"
import { Link, useRouteMatch, Switch, Route } from "react-router-dom"
import { SimpleNav } from "./nav"
import SyntaxHighlighter from "react-syntax-highlighter"
import {
  tomorrowNightBright as darkCodeStyle,
  tomorrow as lightCodeStyle,
} from "react-syntax-highlighter/dist/esm/styles/hljs"
import { TableName } from "../lib/api"
import { useWindowSize } from "../lib/hooks"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    title: {
      marginLeft: 20,
      marginTop: 20,
      fontSize: "x-large",
      fontWeight: "bold",
    },
    description: {
      fontSize: "medium",
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
    link: {
      color:
        theme.palette.primary[theme.palette.type === "dark" ? "light" : "dark"],
    },
  })
)

export default function ApiSpec() {
  const routeMatch = useRouteMatch<{ subpage: string }>("/api-spec/:subpage")
  const subpage = routeMatch?.params.subpage
  const windowSize = useWindowSize()
  return (
    <div>
      <SimpleNav
        links={[
          { name: "Spec", link: "/api-spec" },
          { name: "R code", link: "/api-spec/r-code" },
        ]}
        active={({ name, link }) =>
          (name === "Spec" && !subpage) || link === `/api-spec/${subpage}`
        }
      />
      <div
        style={{ height: windowSize.height - 50 - 50 - 15, overflow: "scroll" }}
      >
        <Switch>
          <Route exact path="/api-spec">
            <FullSpec />
          </Route>
          <Route exact path="/api-spec/r-code">
            <RCode />
          </Route>
        </Switch>
      </div>
    </div>
  )
}

function RCode() {
  const tableNames: TableName[] = [
    "participants",
    "schedule",
    "vaccination",
    "weekly-survey",
    "withdrawn",
  ]
  const classes = useStyles()
  const theme = useTheme()
  return (
    <div>
      <div className={classes.title}>R code to pull data</div>
      <div style={{ marginLeft: 20 }}>
        <div className={classes.description}>
          The token can be obtained on the{" "}
          <MaterialLink className={classes.link} component={Link} to="/email">
            email page
          </MaterialLink>
        </div>
        <SyntaxHighlighter
          language="r"
          style={theme.palette.type === "dark" ? darkCodeStyle : lightCodeStyle}
        >
          {`library(tidyverse)

# \`table_name\` is one of:
# ${tableNames.join(", ")}
pull_table <- function(table_name) {
  httr::GET(
    paste0("${
      API_ROOT.startsWith("/") ? window.location.host : ""
    }${API_ROOT}/", table_name),
    # Replace token with the actual token
    httr::add_headers(Authorization = "Bearer token")
  ) %>%
    httr::content(as = "text") %>%
    jsonlite::fromJSON() %>%
    as_tibble()
}

${tableNames
  .map((t) => `${t.replace("-", "_")} <- pull_table("${t}")`)
  .join("\n")}`}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

function FullSpec() {
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
    <div>
      <div className={classes.title}>{apiSpec.result.info.title}</div>
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
              <span key={k}>
                Bearer{" "}
                <MaterialLink
                  className={classes.link}
                  component={Link}
                  to="email"
                >
                  token ({k})
                </MaterialLink>
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
