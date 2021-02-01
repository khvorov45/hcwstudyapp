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
  Cell,
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
import { Virus } from "../lib/data"
import { interpolateSinebow } from "d3"

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
  virusTable,
}: {
  participantsExtra: ParticipantExtra[]
  serology: SerologyExtra[]
  titreChange: TitreChange[]
  virusTable: Virus[]
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
          <SerologyPlots
            serology={serology}
            titreChange={titreChange}
            virusTable={virusTable}
          />
        </Route>
      </Switch>
    </div>
  )
}

function SerologyPlots({
  serology,
  titreChange,
  virusTable,
}: {
  serology: SerologyExtra[]
  titreChange: TitreChange[]
  virusTable: Virus[]
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
  const days = Array.from(new Set(serology.map((s) => s.day))).sort(
    (a, b) => a - b
  )

  // Filters applied in the order presented
  const [vaccinations, setVaccinations] = useState<
    (number | "(missing)" | null)[]
  >([])
  const [site, setSite] = useState<string[]>([])
  const [virus, setVirus] = useState<string[]>([])
  const [selectedPid, setSelectedPid] = useState<string | null>(null)
  const [selectedDays, setSelectedDays] = useState<number[]>([])

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
  const daysFiltered = pidFiltered.filter(
    (s) => selectedDays.length === 0 || selectedDays.includes(s.day)
  )

  const availablePids = Array.from(
    new Set(siteFiltered.map((s) => s.pid))
  ).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
  const availableDays = Array.from(new Set(pidFiltered.map((s) => s.day))).sort(
    (a, b) => a - b
  )

  const plotPids = Array.from(new Set(pidFiltered.map((s) => s.pid)))

  const titreChangeFiltered = titreChange.filter(
    (t) =>
      plotPids.includes(t.pid) &&
      (virus.length === 0 || (t.virus !== undefined && virus.includes(t.virus)))
  )

  // Summarise the above for plots
  function summariseLogmean(v: number[]) {
    const logs = v.map(Math.log)
    const logmean = d3.mean(logs) ?? NaN
    const se = (d3.deviation(logs) ?? NaN) / Math.sqrt(v.length)
    const mean = Math.exp(logmean)
    const low = mean - Math.exp(logmean - 1.96 * se)
    const high = Math.exp(logmean + 1.96 * se) - mean
    return {
      logmean,
      se,
      mean,
      low,
      high,
      point: isNaN(mean) ? null : mean,
      interval: [isNaN(low) ? null : low, isNaN(high) ? null : high],
    }
  }

  // Summarise each virus
  const virusDaySummarized = d3.rollup(
    daysFiltered,
    (v) => summariseLogmean(v.map((v) => v.titre)),
    (d) => d.virusShortName,
    (d) => d.day,
    (d) => d.prevVac
  )

  // Summarise titre rises
  const titreChangesSummarized = d3.rollup(
    titreChangeFiltered,
    (v) => summariseLogmean(v.map((v) => v.rise)),
    (d) => d.virusShortName
  )

  const serologyPlot = Array.from(virusDaySummarized, ([virus, daySummary]) =>
    Array.from(daySummary, ([day, vacSummary]) =>
      Array.from(vacSummary, ([prevVac, summary]) => ({
        ...summary,
        virus,
        day,
        prevVac,
      }))
    )
  )
    .flat()
    .flat()
    .sort((a, b) => a.prevVac - b.prevVac)
    .sort((a, b) => a.day - b.day)
    .sort((a, b) => (a.virus > b.virus ? 1 : a.virus < b.virus ? -1 : 0))

  const titreChangesPlot = Array.from(
    titreChangesSummarized,
    ([virus, summary]) => {
      return {
        ...summary,
        virus,
      }
    }
  ).sort((a, b) => (a.virus > b.virus ? 1 : a.virus < b.virus ? -1 : 0))

  const dayColors = createDescreteMapping(days)

  // Plot width
  const widthPerVac = 20
  const widthPerDay =
    (vaccinations.length === 0 ? prevVacs.length : vaccinations.length) *
    widthPerVac
  const widthPerVirus =
    (selectedDays.length === 0 ? availableDays.length : selectedDays.length) *
    widthPerDay

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
          inputMode="none"
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
          inputMode="none"
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
        <SelectorMultiple
          options={availableDays}
          label="Day"
          width={150}
          value={selectedDays}
          onChange={setSelectedDays}
          inputMode="none"
        />
      </ControlRibbon>
      <ScreenHeight heightTaken={50 + 50 + 100}>
        <PointRange
          data={serologyPlot}
          xKey="prevVac"
          xKey2="day"
          xKey3="virus"
          yRange={[5, 10240]}
          yTicks={[5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240]}
          yLab={selectedPid ? "Titre" : "GMT (95% CI)"}
          xAngle={0}
          xLab="Vax"
          xTickDy={10}
          x2Lab="Day"
          x3RenderPayload={(value, xOffset) => (
            <VirusTick name={value} xOffset={xOffset} viruses={virusTable} />
          )}
          getPointColor={(v) => dayColors[v.day]}
          minWidth={
            (virus.length === 0 ? viruses.length : virus.length) * widthPerVirus
          }
          maxWidth={
            (virus.length === 0 ? viruses.length : virus.length) *
            widthPerVirus *
            3
          }
          height={500}
        />
        <PointRange
          data={titreChangesPlot}
          xKey="virus"
          yRange={[1, 30]}
          yTicks={[0.5, 1, 2, 5, 10, 20, 30]}
          yLab={selectedPid ? "Fold-rise (14 vs 0)" : "GMR (14 vs 0, 95% CI)"}
          xAngle={-45}
          xRenderPayload={(value) => (
            <VirusTick name={value} xOffset={0} viruses={virusTable} />
          )}
          minWidth={(virus.length === 0 ? viruses.length : virus.length) * 50}
          maxWidth={(virus.length === 0 ? viruses.length : virus.length) * 100}
          height={400}
        />
      </ScreenHeight>
    </div>
  )
}

function createDescreteMapping<T extends string | number>(
  x: T[]
): Record<T, string> {
  return x.reduce(
    (acc, v, i) => ({ ...acc, [v]: interpolateSinebow(i / x.length) }),
    {} as Record<T, string>
  )
}

function VirusTick({
  name,
  xOffset,
  viruses,
}: {
  name: string
  xOffset: number
  viruses: Virus[]
}) {
  return (
    <>
      <tspan x={xOffset}>{name}</tspan>
      <tspan x={xOffset} dy={14}>
        {viruses.find((v) => v.shortName === name)?.clade}
      </tspan>
    </>
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
      inputMode="none"
    />
  )
}

function CustomizedAxisTick({
  x,
  y,
  dy,
  payload,
  color,
  angle,
  renderPayload,
}: {
  x?: number
  y?: number
  dy?: number
  payload?: any
  color: string
  angle: number
  renderPayload: (v: any) => ReactNode
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={dy}
        width={250}
        textAnchor={angle === 0 ? "middle" : "end"}
        transform={`rotate(${angle})`}
        fill={color}
      >
        {renderPayload(payload.value)}
      </text>
    </g>
  )
}

function CustomizedAxisTickGrouped<T extends object>({
  x,
  y,
  payload,
  data,
  dataKey,
  color,
  renderPayload,
}: {
  x?: number
  y?: number
  payload?: any
  data: T[]
  dataKey: keyof T
  color: string
  renderPayload: (v: any, offset: number) => ReactNode
}) {
  // Assume sorted
  if (data[payload.index - 1]?.[dataKey] !== payload.value) {
    const xOffset = 0 //payload.offset * Math.floor(relevantSubset.length / 2)
    return (
      <g>
        <line
          x1={x ? x - 7 : x}
          y1={y ? y - 2 : y}
          x2={x ? x - 7 : x}
          y2={y ? y - 32 : y}
          style={{ stroke: color, strokeWidth: 2 }}
        />
        <g transform={`translate(${x},${y})`}>
          <text
            x={xOffset}
            y={0}
            dy={16}
            width={250}
            textAnchor="end"
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

function minmax(x: number, min: number, max: number) {
  return x < min ? min : x > max ? max : x
}

function PointRange<
  T extends { point: number | null; interval: (number | null)[] }
>({
  data,
  xKey,
  xKey2,
  xKey3,
  yRange,
  yTicks,
  yLab,
  xAngle,
  xRenderPayload,
  xTickDy,
  xLab,
  x2RenderPayload,
  x2Lab,
  x3RenderPayload,
  getPointColor,
  height,
  minWidth,
  maxWidth,
}: {
  data: T[]
  xKey: keyof T
  xKey2?: keyof T
  xKey3?: keyof T
  yRange: [number, number]
  yTicks: number[]
  yLab: string
  xAngle: number
  xTickDy?: number
  xLab?: string
  xRenderPayload?: (value: any) => ReactNode
  x2RenderPayload?: (value: any, xOffset: number) => ReactNode
  x2Lab?: string
  x3RenderPayload?: (value: any, xOffset: number) => ReactNode
  getPointColor?: (x: T) => string
  height: number
  minWidth: number
  maxWidth: number
}) {
  const windowSize = useWindowSize()
  const theme = useTheme()
  const scrollBarWidth = detectScrollbarWidth()
  // If nothing to display
  if (data.filter((d) => d.point).length === 0) {
    return <></>
  }
  return (
    <div
      style={{
        overflowX: "scroll",
        overflowY: "hidden",
        height: height + scrollBarWidth,
      }}
    >
      <ScatterChart
        data={data}
        margin={{ top: 20, right: 0, bottom: 90, left: 10 }}
        // 80px is approximately how big the vertical axis is
        width={
          minmax(windowSize.width - scrollBarWidth - 80, minWidth, maxWidth) +
          80
        }
        height={height}
      >
        <CartesianGrid stroke={theme.palette.background.alt} />
        <Scatter data={data}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                getPointColor?.(entry) ??
                theme.palette.primary[
                  theme.palette.type === "dark" ? "light" : "dark"
                ]
              }
            />
          ))}
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
              renderPayload={xRenderPayload ?? ((v) => <tspan>{v}</tspan>)}
              dy={xTickDy}
            />
          }
        >
          <Label
            fill={theme.palette.text.primary}
            position="insideLeft"
            offset={-30}
          >
            {xLab}
          </Label>
        </XAxis>

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
                renderPayload={
                  x2RenderPayload ?? ((v, o) => <tspan>{v}</tspan>)
                }
              />
            }
          >
            <Label
              fill={theme.palette.text.primary}
              position="insideLeft"
              offset={-30}
            >
              {x2Lab}
            </Label>
          </XAxis>
        )}

        {xKey3 && (
          <XAxis
            dataKey={xKey3 as string}
            xAxisId={xKey3 as string}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={
              <CustomizedAxisTickGrouped
                data={data}
                dataKey={xKey3}
                color={theme.palette.text.secondary}
                renderPayload={
                  x3RenderPayload ?? ((v, o) => <tspan>{v}</tspan>)
                }
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
    </div>
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
  inputMode,
}: {
  options: T[]
  label: string
  value: T[]
  onChange: (s: T[]) => void
  width: number
  inputMode?: "text" | "numeric" | "none"
}) {
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(o) => `${o}`}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          inputProps={{ ...params.inputProps, inputMode: inputMode ?? "text" }}
        />
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
