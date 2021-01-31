import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Label,
  ScatterChart,
  Scatter,
  ErrorBar,
  CartesianGrid,
  Text,
} from "recharts"
import {
  createStyles,
  makeStyles,
  TextField,
  Theme,
  useTheme,
} from "@material-ui/core"
import * as d3 from "d3-array"
import React, { ReactNode, useState } from "react"
import { Route, useRouteMatch, Switch, Redirect } from "react-router-dom"
import { SimpleNav } from "./nav"
import ScreenHeight from "./screen-height"
import Autocomplete from "@material-ui/lab/Autocomplete"
import { useWindowSize } from "../lib/hooks"
import detectScrollbarWidth from "../lib/scrollbar-width"
import { ParticipantExtra, SerologyExtra, TitreChange } from "../lib/table-data"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    control: {
      display: "flex",
      overflow: "scroll",
      "&>*": {
        marginRight: 10,
        marginTop: 5,
        paddingTop: 5,
        flexShrink: 0,
        height: 100 - 6 - detectScrollbarWidth(),
        overflowY: "scroll",
        overflowX: "hidden",
      },
      height: 100,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  })
)

export default function Plots({
  participantsExtra,
  serology,
  titreChange,
}: {
  participantsExtra: ParticipantExtra[]
  serology: SerologyExtra[]
  titreChange: TitreChange[]
}) {
  const routeMatch = useRouteMatch<{ subpage: string }>("/plots/:subpage")
  const subpage = routeMatch?.params.subpage
  return (
    <div>
      <SimpleNav
        links={[
          { name: "Baseline", link: "/plots/baseline" },
          { name: "Serology", link: "/plots/serology" },
        ]}
        active={({ link }) => link === `/plots/${subpage}`}
      />
      <Switch>
        <Route exact path="/plots">
          <Redirect to="/plots/baseline" />
        </Route>
        <Route exact path="/plots/baseline">
          <BaselinePlots participantsExtra={participantsExtra} />
        </Route>
        <Route exact path="/plots/serology">
          <SerologyPlots serology={serology} titreChange={titreChange} />
        </Route>
      </Switch>
    </div>
  )
}

function SerologyPlots({
  serology,
  titreChange,
}: {
  serology: SerologyExtra[]
  titreChange: TitreChange[]
}) {
  const viruses = Array.from(
    new Set(serology.map((s) => s.virus))
  ).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
  const sites = Array.from(new Set(serology.map((s) => s.site ?? "(missing)")))
  const prevVacs = Array.from(
    new Set(serology.map((s) => s.prevVac ?? Infinity))
  )
    .sort((a, b) => a - b)
    .map((x) => (x === Infinity ? "(missing)" : x))

  // Filters applied in the order presented
  const [vaccinations, setVaccinations] = useState<
    (number | "(missing)" | null)[]
  >([])
  const [site, setSite] = useState<string[]>([])
  const [virus, setVirus] = useState<string[]>([])
  const [selectedPid, setSelectedPid] = useState<string | null>(null)

  const vacFiltered = serology.filter(
    (s) =>
      vaccinations.length === 0 ||
      (vaccinations.includes("(missing)") && s.prevVac === undefined) ||
      (s.prevVac !== undefined && vaccinations.includes(s.prevVac))
  )
  const siteFiltered = vacFiltered.filter(
    (s) => site.length === 0 || (s.site !== undefined && site.includes(s.site))
  )
  const virusFiltered = siteFiltered.filter(
    (s) =>
      virus.length === 0 || (s.virus !== undefined && virus.includes(s.virus))
  )
  const pidFiltered = virusFiltered.filter(
    (s) => !selectedPid || s.pid === selectedPid
  )

  const availablePids = Array.from(
    new Set(siteFiltered.map((s) => s.pid))
  ).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))

  const plotPids = Array.from(new Set(pidFiltered.map((s) => s.pid)))

  const titreChangeFiltered = titreChange.filter(
    (t) =>
      plotPids.includes(t.pid) &&
      (virus.length === 0 || (t.virus !== undefined && virus.includes(t.virus)))
  )

  // Summarise each virus
  const virusDaySummarized = d3.rollup(
    pidFiltered,
    (v) => ({
      logmean: d3.mean(v.map((d) => Math.log(d.titre))) ?? NaN,
      se:
        (d3.deviation(v.map((d) => Math.log(d.titre))) ?? NaN) /
        Math.sqrt(v.length),
    }),
    (d) => d.virusShortName,
    (d) => d.day
  )

  // Summarise titre rises
  const titreChangesSummarized = d3.rollup(
    titreChangeFiltered,
    (v) => {
      const logRises = v.map((d) => Math.log(d.rise))
      return {
        logmean: d3.mean(logRises) ?? NaN,
        se: (d3.deviation(logRises) ?? NaN) / Math.sqrt(logRises.length),
      }
    },
    (d) => d.virus
  )

  const serologyPlot = Array.from(virusDaySummarized, ([virus, daySummary]) =>
    Array.from(daySummary, ([day, summary]) => {
      const mean = Math.exp(summary.logmean)
      const low = mean - Math.exp(summary.logmean - 1.96 * summary.se)
      const high = Math.exp(summary.logmean + 1.96 * summary.se) - mean
      return {
        virus,
        day,
        point: isNaN(mean) ? null : mean,
        interval: [isNaN(low) ? null : low, isNaN(high) ? null : high],
      }
    })
  )
    .flat()
    .sort((a, b) => a.day - b.day)
    .sort((a, b) => (a.virus > b.virus ? 1 : a.virus < b.virus ? -1 : 0))

  const titreChangesPlot = Array.from(
    titreChangesSummarized,
    ([virus, summary]) => {
      const mean = Math.exp(summary.logmean)
      const low = mean - Math.exp(summary.logmean - 1.96 * summary.se)
      const high = Math.exp(summary.logmean + 1.96 * summary.se) - mean
      return {
        virus,
        point: isNaN(mean) ? null : mean,
        interval: [isNaN(low) ? null : low, isNaN(high) ? null : high],
      }
    }
  ).sort((a, b) => (a.virus > b.virus ? 1 : a.virus < b.virus ? -1 : 0))

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <ControlRibbon>
        <SelectorMultiple
          options={prevVacs}
          label="Vaccinations"
          value={vaccinations}
          onChange={(n) => {
            setVaccinations(n)
            setSelectedPid(null)
          }}
          width={150}
        />
        <SiteSelect
          sites={sites}
          site={site}
          setSite={(s) => {
            setSite(s)
            setSelectedPid(null)
          }}
        />
        <SelectorMultiple
          options={viruses}
          label="Virus"
          width={225}
          value={virus}
          onChange={setVirus}
        />
        <Selector
          options={availablePids}
          label="PID"
          width={150}
          value={selectedPid}
          onChange={(n) => {
            setSelectedPid(n)
            const thisPid = pidFiltered.find((d) => d.pid === n)
            if (thisPid?.site !== undefined) {
              setSite([thisPid.site])
            }
            if (thisPid?.prevVac !== undefined) {
              setVaccinations([thisPid.prevVac])
            }
          }}
        />
      </ControlRibbon>
      <ScreenHeight heightTaken={50 + 50 + 100}>
        <PointRange
          data={serologyPlot}
          xKey="day"
          xKey2="virus"
          yRange={[5, 10240]}
          yTicks={[5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240]}
          yLab={selectedPid ? "Titre" : "GMT (95% CI)"}
          xAngle={-45}
          x2LineOffsetCoefficient={3}
          x2RenderPayload={(value, xOffset) => {
            return (
              <>
                <tspan x={xOffset}>{value}</tspan>
                <tspan x={xOffset} dy={20}>
                  {
                    pidFiltered.find((p) => p.virusShortName === value)
                      ?.virusClade
                  }
                </tspan>
              </>
            )
          }}
        />
        <PointRange
          data={titreChangesPlot}
          xKey="virus"
          yRange={[1, 30]}
          yTicks={[0.5, 1, 2, 5, 10, 20, 30]}
          yLab={selectedPid ? "Fold-rise (14 vs 0)" : "GMR (14 vs 0, 95% CI)"}
          xAngle={-45}
        />
      </ScreenHeight>
    </div>
  )
}

function BaselinePlots({
  participantsExtra,
}: {
  participantsExtra: ParticipantExtra[]
}) {
  const sites = Array.from(new Set(participantsExtra.map((p) => p.site)))
  const [site, setSite] = useState<string[]>([])
  return (
    <ScreenHeight heightTaken={50 + 50}>
      <SiteSelect sites={sites} site={site} setSite={setSite} />
      <PlotColumn
        participantsExtra={participantsExtra.filter(
          (p) =>
            site.length === 0 || (p.site !== undefined && site.includes(p.site))
        )}
      />
    </ScreenHeight>
  )
}

function PlotColumn({
  participantsExtra,
}: {
  participantsExtra: ParticipantExtra[]
}) {
  const genderCounts = d3.rollup(
    participantsExtra,
    (v) => v.length,
    (p) => p.gender
  )

  const priorVaccinationCounts = d3.rollup(
    participantsExtra,
    (v) => v.length,
    (p) => p.prevVac
  )

  const agesBinned = d3
    .bin()
    .thresholds([18, 30, 40, 50, 66])(participantsExtra.map((p) => p.age))
    .map((a) => ({
      range:
        a.x0! < 18
          ? `<${a.x1}`
          : a.x1! > 66
          ? `>=${a.x0}`
          : `${a.x0}-${a.x1! - 1}`,
      count: a.length,
    }))
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <GenericBar data={agesBinned} xLab="Age" xKey="range" yKey="count" />
      <GenericBar
        data={Array.from(genderCounts, ([k, v]) => ({
          gender: k ?? "(missing)",
          count: v,
        }))}
        xLab="Gender"
        xKey="gender"
        yKey="count"
      />
      <GenericBar
        data={Array.from(priorVaccinationCounts, ([k, v]) => ({
          priorVaccinations: k ?? "(missing)",
          count: v,
        })).sort((a, b) =>
          a.priorVaccinations > b.priorVaccinations
            ? 1
            : a.priorVaccinations < b.priorVaccinations
            ? -1
            : 0
        )}
        xLab="Known prior vaccinations"
        xKey="priorVaccinations"
        yKey="count"
      />
    </div>
  )
}

function GenericBar<T extends Record<string, string | number>>({
  data,
  xLab,
  xKey,
  yKey,
}: {
  data: T[]
  xLab: string
  xKey: keyof T
  yKey: keyof T
}) {
  const theme = useTheme()
  const windowSize = useWindowSize()
  if (data.length === 0 || !data.some((r) => r[yKey] > 0)) return <></>
  return (
    <BarChart
      width={windowSize.width - 20 > 450 ? 450 : windowSize.width - 20}
      height={250}
      data={data}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    >
      <XAxis
        dataKey={xKey as string}
        tick={{
          fill: theme.palette.text.secondary,
        }}
      >
        <Label
          value={xLab}
          position="bottom"
          style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
        />
      </XAxis>
      <YAxis tick={{ fill: theme.palette.text.secondary }}>
        <Label
          angle={-90}
          value="Count"
          position="insideLeft"
          style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
        />
      </YAxis>
      <Tooltip
        contentStyle={{
          background: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
        }}
        cursor={{ fill: theme.palette.background.alt }}
        itemStyle={{
          color: theme.palette.text.primary,
        }}
      />
      <Bar
        dataKey={yKey as string}
        fill={
          theme.palette.primary[
            theme.palette.type === "dark" ? "light" : "dark"
          ]
        }
        isAnimationActive={false}
      />
    </BarChart>
  )
}

function SiteSelect({
  sites,
  site,
  setSite,
}: {
  sites: string[]
  site: string[]
  setSite: (s: string[]) => void
}) {
  return (
    <SelectorMultiple
      options={sites}
      label="Site"
      width={200}
      value={site}
      onChange={setSite}
    />
  )
}

function CustomizedAxisTick({
  x,
  y,
  payload,
  color,
  angle,
}: {
  x?: number
  y?: number
  payload?: any
  color: string
  angle: number
}) {
  return (
    <Text
      x={x}
      y={y}
      width={250}
      textAnchor={angle === 0 ? "middle" : "end"}
      verticalAnchor="middle"
      angle={angle}
      fill={color}
    >
      {payload.value}
    </Text>
  )
}

function CustomizedAxisTickGrouped<T extends object>({
  x,
  y,
  payload,
  data,
  dataKey,
  color,
  lineOffsetCoefficient,
  renderPayload,
}: {
  x?: number
  y?: number
  payload?: any
  data: T[]
  dataKey: keyof T
  color: string
  lineOffsetCoefficient: number
  renderPayload: (v: any, offset: number) => ReactNode
}) {
  const relevantSubset = data.filter(
    (row: any) => row[dataKey] === payload.value
  )
  const firstIdx = data.findIndex((row: any) => row[dataKey] === payload.value)
  // Draw once per group
  if (firstIdx === payload.index) {
    const xOffset = payload.offset * Math.floor(relevantSubset.length / 2)
    const lineOffset =
      payload.offset *
      Math.floor(relevantSubset.length / 2) *
      lineOffsetCoefficient
    return (
      <g>
        <line
          x1={x}
          y1={y ? y - 2 : y}
          x2={x ? x + lineOffset : x}
          y2={y ? y - 2 : y}
          style={{ stroke: color, strokeWidth: 2 }}
        />
        <g transform={`translate(${x},${y})`}>
          <text
            x={xOffset}
            y={0}
            dy={16}
            width={250}
            //angle={-45}
            textAnchor="end"
            //verticalAnchor="start"
            fill={color}
            transform={`rotate(-45, ${xOffset}, 0)`}
          >
            {renderPayload(payload.value, xOffset)}
          </text>
        </g>
      </g>
    )
  }
  return null
}

function PointRange<
  T extends { point: number | null; interval: (number | null)[] }
>({
  data,
  xKey,
  xKey2,
  yRange,
  yTicks,
  yLab,
  xAngle,
  x2LineOffsetCoefficient,
  x2RenderPayload,
}: {
  data: T[]
  xKey: keyof T
  xKey2?: keyof T
  yRange: [number, number]
  yTicks: number[]
  yLab: string
  xAngle: number
  x2LineOffsetCoefficient?: number
  x2RenderPayload?: (value: any, xOffset: number) => ReactNode
}) {
  const windowSize = useWindowSize()
  const theme = useTheme()
  // If nothing to display
  if (data.filter((d) => d.point).length === 0) {
    return <></>
  }
  return (
    <ScatterChart
      data={data}
      width={windowSize.width - 20 > 800 ? 800 : windowSize.width - 20}
      height={400}
      margin={{ top: 20, right: 20, bottom: 125, left: 20 }}
    >
      <CartesianGrid stroke={theme.palette.background.alt} />
      <Scatter
        data={data}
        fill={
          theme.palette.primary[
            theme.palette.type === "dark" ? "light" : "dark"
          ]
        }
      >
        <ErrorBar
          dataKey={"interval"}
          stroke={
            theme.palette.primary[
              theme.palette.type === "dark" ? "light" : "dark"
            ]
          }
        />
      </Scatter>

      <XAxis
        dataKey={xKey as string}
        interval={0}
        tick={
          <CustomizedAxisTick
            color={theme.palette.text.secondary}
            angle={xAngle}
          />
        }
      />

      {xKey2 && (
        <XAxis
          dataKey={xKey2 as string}
          xAxisId={xKey2 as string}
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={
            <CustomizedAxisTickGrouped
              data={data}
              dataKey={xKey2}
              color={theme.palette.text.secondary}
              lineOffsetCoefficient={x2LineOffsetCoefficient ?? 0}
              renderPayload={x2RenderPayload ?? ((v, o) => <></>)}
            />
          }
        />
      )}

      <YAxis
        dataKey="point"
        tick={{
          fill: theme.palette.text.secondary,
        }}
        domain={yRange}
        ticks={yTicks}
        scale="log"
        minTickGap={0}
      >
        <Label
          angle={-90}
          value={yLab}
          position="insideLeft"
          style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
        />
      </YAxis>
    </ScatterChart>
  )
}

function Selector<T>({
  options,
  label,
  value,
  onChange,
  width,
}: {
  options: T[]
  label: string
  value: T | null
  onChange: (s: T | null) => void
  width: number
}) {
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(o) => `${o}`}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" />
      )}
      value={value}
      onChange={(e, n) => onChange(n)}
      style={{ width }}
    />
  )
}

function SelectorMultiple<T>({
  options,
  label,
  value,
  onChange,
  width,
}: {
  options: T[]
  label: string
  value: T[]
  onChange: (s: T[]) => void
  width: number
}) {
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(o) => `${o}`}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" />
      )}
      value={value}
      onChange={(e, n) => onChange(n)}
      style={{ width }}
      multiple
      disableCloseOnSelect
    />
  )
}

function ControlRibbon({ children }: { children: ReactNode }) {
  const classes = useStyles()
  return <div className={classes.control}>{children}</div>
}
