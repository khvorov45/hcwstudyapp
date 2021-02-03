import { BarChart, XAxis, YAxis, Tooltip, Bar, Label } from "recharts"
import {
  Checkbox,
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
import { scaleOrdinal, scaleLog, scaleLinear } from "d3-scale"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    control: {
      display: "flex",
      overflowX: "scroll",
      overflowY: "hidden",
      "&>*": {
        borderRight: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        height: 56,
        overflow: "hidden",
      },
      "&>*:last-child": {
        borderRight: 0,
      },
      height: 56 + detectScrollbarWidth(),
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

function PlotContainer({ children }: { children: ReactNode }) {
  return (
    <ScreenHeight heightTaken={50 + 50 + 56 + detectScrollbarWidth()}>
      {children}
    </ScreenHeight>
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
  const prevVacs = Array.from(new Set(serology.map((s) => s.prevVac))).sort(
    (a, b) => a - b
  )
  const days = Array.from(new Set(serology.map((s) => s.day))).sort(
    (a, b) => a - b
  )

  // Filters applied in the order presented
  const [vaccinations, setVaccinations] = useState<number[]>([0, 5])
  const [site, setSite] = useState<string[]>([])
  const [virus, setVirus] = useState<string[]>([])
  const [selectedPid, setSelectedPid] = useState<string | null>(null)
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 14])

  const vacFiltered = serology.filter(
    (s) =>
      vaccinations.length === 0 ||
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
      low: mean - low,
      high: mean + high,
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
    .flat(2)
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

  return (
    <>
      <ControlRibbon>
        <SelectorMultiple
          options={prevVacs}
          label="Vaccinations"
          value={vaccinations}
          onChange={(n) => {
            setVaccinations(n)
            setSelectedPid(null)
          }}
          width={200}
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
          width={200}
          value={selectedDays}
          onChange={setSelectedDays}
          inputMode="none"
        />
      </ControlRibbon>
      <PlotContainer>
        <PointRange
          data={serologyPlot}
          xAccessor={(d) => [d.virus, d.day.toString(), d.prevVac.toString()]}
          yAccessor={(d) => ({ point: d.mean, low: d.low, high: d.high })}
          minWidthPerX={20}
          maxWidthMultiplier={3}
          height={500}
          yAxisSpec={{
            min: 5,
            max: 10240,
            ticks: [5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240],
            lab: selectedPid ? "Titre" : "GMT (95% CI)",
            leftpad: 20,
          }}
          getColor={(v) => dayColors[v.day]}
          xAxisSpec={[
            {
              textAnchor: "start",
              angle: 45,
              renderTick: (props) => (
                <VirusTick {...props} viruses={virusTable} />
              ),
            },
            { name: "Day" },
            { name: "Vax" },
          ]}
          pad={{
            axis: { top: 10, bottom: 150, left: 55, right: 80 },
            data: { top: 0, right: 0, bottom: 10, left: 10 },
          }}
          categorySeparatorXLevel={0}
        />
        <PointRange
          data={titreChangesPlot}
          xAccessor={(d) => [d.virus]}
          yAccessor={(d) => ({ point: d.mean, low: d.low, high: d.high })}
          minWidthPerX={20}
          maxWidthMultiplier={3}
          height={400}
          yAxisSpec={{
            min: 0.5,
            max: 30,
            ticks: [0.5, 1, 2, 5, 10, 20, 30],
            lab: selectedPid ? "Fold-rise (14 vs 0)" : "GMR (14 vs 0, 95% CI)",
            leftpad: 20,
          }}
          xAxisSpec={[
            {
              textAnchor: "start",
              angle: 45,
              renderTick: (props) => (
                <VirusTick {...props} viruses={virusTable} />
              ),
            },
          ]}
          pad={{
            axis: { top: 10, bottom: 150, left: 55, right: 80 },
            data: { top: 0, right: 0, bottom: 10, left: 10 },
          }}
        />
      </PlotContainer>
    </>
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
  tick,
  x,
  y,
  viruses,
}: {
  tick: string
  x: number
  y: number
  viruses: Virus[]
}) {
  return (
    <>
      <tspan x={x} y={y}>
        {tick}
      </tspan>
      <tspan x={x} y={y + 14}>
        {viruses.find((v) => v.shortName === tick)?.clade}
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
    <>
      <ControlRibbon>
        <SiteSelect sites={sites} site={site} setSite={setSite} />
      </ControlRibbon>
      <PlotContainer>
        <PlotColumn
          participantsExtra={participantsExtra.filter(
            (p) =>
              site.length === 0 ||
              (p.site !== undefined && site.includes(p.site))
          )}
        />
      </PlotContainer>
    </>
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
          // @ts-ignore
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

function minmax(x: number, min: number, max: number) {
  return x < min ? min : x > max ? max : x
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
        <SelectorTextField params={params} label={label} />
      )}
      value={value}
      onChange={(e, n) => onChange(n)}
      style={{ width }}
    />
  )
}

function SelectorTextField({
  params,
  label,
  inputMode,
}: {
  params: any
  label: string
  inputMode?: "text" | "numeric" | "none"
}) {
  const theme = useTheme()
  return (
    <TextField
      {...params}
      label={label}
      variant="filled"
      inputProps={{ ...params.inputProps, inputMode: inputMode ?? "text" }}
      InputProps={{
        ...params.InputProps,
        disableUnderline: true,
        style: { backgroundColor: theme.palette.background.default },
      }}
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
        <SelectorTextField
          params={params}
          label={label}
          inputMode={inputMode}
        />
      )}
      renderTags={(value, getProps) => <div>{`${value.length} selected`}</div>}
      renderOption={(option, { selected }) => (
        <>
          <Checkbox checked={selected} size="small" />
          {option}
        </>
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

type Pad = {
  top: number
  bottom: number
  left: number
  right: number
}

function PointRange<T extends Object>({
  data,
  xAccessor,
  yAccessor,
  minWidthPerX,
  maxWidthMultiplier,
  height,
  yAxisSpec,
  getColor,
  xAxisSpec,
  categorySeparatorXLevel,
  pad,
}: {
  data: T[]
  xAccessor: (d: T) => string[]
  yAccessor: (d: T) => { point: number; low: number; high: number }
  minWidthPerX: number
  maxWidthMultiplier: number
  height: number
  yAxisSpec: {
    min: number
    max: number
    ticks: number[]
    lab: string
    leftpad: number
  }
  getColor?: (x: T) => string
  xAxisSpec: {
    name?: string
    textAnchor?: "middle" | "start"
    angle?: number
    renderTick?: (props: { tick: string; x: number; y: number }) => ReactNode
  }[]
  categorySeparatorXLevel?: number
  pad: { axis: Pad; data: Pad }
}) {
  // Figure out plot dimensions (data-dependent)
  const uniqueXs = Array.from(new Set(data.map((x) => xAccessor(x))))
  const minWidth =
    minWidthPerX * uniqueXs.length +
    pad.axis.left +
    pad.axis.right +
    pad.data.left +
    pad.data.right
  const windowSize = useWindowSize()
  const width =
    minmax(windowSize.width, minWidth, minWidth * maxWidthMultiplier) -
    detectScrollbarWidth()
  const dataWidth =
    width - pad.axis.right - pad.data.right - pad.axis.left - pad.data.left
  const actualWidthPerX = dataWidth / uniqueXs.length

  // Now the elements that depend on plot dimensions
  const axisTitleY = [
    yAxisSpec.leftpad,
    (height - pad.axis.top - pad.axis.bottom) / 2,
  ]

  const scaleXIndex = scaleLinear(
    [0, uniqueXs.length - 1],
    [pad.axis.left + pad.data.left, width - pad.axis.right - pad.data.right]
  )
  const scaleX = scaleOrdinal(
    uniqueXs,
    uniqueXs.map((x, i) => scaleXIndex(i))
  )

  const scaleY = scaleLog(
    [yAxisSpec.min, yAxisSpec.max],
    [height - pad.axis.bottom - pad.data.bottom, pad.axis.top + pad.data.top]
  )

  // X-separators
  let xSep: string[][] = []
  uniqueXs.reduce((acc, cur, i) => {
    if (categorySeparatorXLevel === undefined) {
      return acc
    }
    if (i === 0) {
      acc.push(cur)
      return acc
    }
    if (
      cur[categorySeparatorXLevel] !==
      acc[acc.length - 1][categorySeparatorXLevel]
    ) {
      acc.push(cur)
    }
    return acc
  }, xSep)

  // Colors and distances
  const theme = useTheme()
  const axisColor =
    theme.palette.type === "dark"
      ? theme.palette.grey[300]
      : theme.palette.grey[700]
  const gridColor =
    theme.palette.type === "dark"
      ? theme.palette.grey[800]
      : theme.palette.grey[200]
  const xAxesDistance = 15
  const distanceFromTicks = 7
  const tickLength = 5
  return (
    <div
      style={{
        overflowX: "scroll",
        overflowY: "hidden",
        height: height + detectScrollbarWidth(),
      }}
    >
      <svg width={width} height={height}>
        {/* Category separators */}
        {xSep.map((x, i) => {
          const x1 = scaleX(x) - actualWidthPerX / 2
          const x2 =
            scaleX(
              i === xSep.length - 1
                ? uniqueXs[uniqueXs.length - 1]
                : xSep[i + 1]
            ) +
            (actualWidthPerX / 2) * (i === xSep.length - 1 ? 0 : -1)

          return (
            <rect
              x={x1}
              y={pad.axis.top}
              width={x2 - x1}
              height={height - pad.axis.bottom - pad.axis.top}
              fill={
                i % 2 === 0
                  ? theme.palette.background.default
                  : theme.palette.background.alt
              }
            />
          )
        })}
        {/* Y-axis */}
        {/* Line */}
        <VLine
          x={pad.axis.left}
          y1={height - pad.axis.bottom}
          y2={pad.axis.top}
          color={axisColor}
        />
        {/* Name */}
        <text
          x={axisTitleY[0]}
          y={axisTitleY[1]}
          fill={theme.palette.text.primary}
          textAnchor="middle"
          transform={`rotate(-90, ${axisTitleY[0]}, ${axisTitleY[1]})`}
        >
          {yAxisSpec.lab}
          {/* Ticks */}
        </text>
        {yAxisSpec.ticks.map((yTick) => {
          const y = scaleY(yTick)
          return (
            <g key={`yTick-${yTick}`}>
              {/* Number */}
              <text
                fill={theme.palette.text.secondary}
                x={pad.axis.left - distanceFromTicks}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {yTick}
              </text>
              {/* Tick */}
              <HLine
                x1={pad.axis.left - tickLength}
                x2={pad.axis.left}
                y={y}
                color={axisColor}
              />
              {/* Grid line */}
              <HLine
                x1={pad.axis.left}
                x2={width - pad.axis.right}
                y={y}
                color={gridColor}
              />
            </g>
          )
        })}
        {/* X-axis */}
        {/* Line */}
        <HLine
          x1={pad.axis.left}
          x2={width - pad.axis.right}
          y={height - pad.axis.bottom}
          color={axisColor}
        />
        {/* Name(s) */}
        {xAxisSpec?.map((xAxis, i) => (
          <text
            x={pad.axis.left}
            y={
              height -
              pad.axis.bottom +
              distanceFromTicks +
              (xAxisSpec.length - i - 1) * xAxesDistance
            }
            fill={theme.palette.text.primary}
            textAnchor="end"
            dominantBaseline="hanging"
          >
            {xAxis.name}
          </text>
        ))}

        {/* Ticks */}
        {uniqueXs.map((xTickGroup, i) => {
          let prevX = i === 0 ? [] : uniqueXs[i - 1]
          const x = scaleX(xTickGroup)
          // Assume the values are already sorted
          return (
            <g key={`tick-group-x-${i}`}>
              {/* Print the value if the previous one is not the same */}
              {xTickGroup.map((xTick, j) => {
                const y =
                  height -
                  pad.axis.bottom +
                  distanceFromTicks +
                  (xTickGroup.length - j - 1) * xAxesDistance
                return (
                  prevX[j] !== xTick && (
                    <text
                      key={`tick-x-${j}`}
                      x={x}
                      y={y}
                      textAnchor={xAxisSpec?.[j]?.textAnchor ?? "middle"}
                      dominantBaseline="hanging"
                      fill={theme.palette.text.secondary}
                      transform={`rotate(${
                        xAxisSpec[j]?.angle ?? 0
                      }, ${x}, ${y})`}
                    >
                      {xAxisSpec[j]?.renderTick?.({ tick: xTick, x, y }) ??
                        xTick}
                    </text>
                  )
                )
              })}
              {/* Tick */}
              <VLine
                x={x}
                y1={height - pad.axis.bottom + tickLength}
                y2={height - pad.axis.bottom}
                color={axisColor}
              />
              {/* Grid line */}
              <VLine
                x={x}
                y1={height - pad.axis.bottom}
                y2={pad.axis.top}
                color={gridColor}
              />
            </g>
          )
        })}
        {/* Data */}
        {data.map((d, i) => {
          const color =
            getColor?.(d) ??
            theme.palette.primary[
              theme.palette.type === "dark" ? "light" : "dark"
            ]
          const x = scaleX(xAccessor(d))
          const y = yAccessor(d)
          return (
            <g key={`point-${i}`}>
              <line
                x1={x}
                x2={x}
                y1={scaleY(y.low)}
                y2={scaleY(y.high)}
                stroke={color}
                strokeWidth={3}
              />
              <circle r={5} fill={color} cx={x} cy={scaleY(y.point)} />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function VLine({
  x,
  y1,
  y2,
  color,
}: {
  x: number
  y1: number
  y2: number
  color: string
}) {
  return <line x1={x} x2={x} y1={y1} y2={y2} stroke={color} />
}

function HLine({
  y,
  x1,
  x2,
  color,
}: {
  y: number
  x1: number
  x2: number
  color: string
}) {
  return <line x1={x1} x2={x2} y1={y} y2={y} stroke={color} />
}
