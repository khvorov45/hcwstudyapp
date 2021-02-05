import { useTheme } from "@material-ui/core"
import * as d3 from "d3-array"
import React, { ReactNode, useState } from "react"
import { Route, useRouteMatch, Switch, Redirect } from "react-router-dom"
import { SimpleNav } from "./nav"
import ScreenHeight from "./screen-height"
import { useWindowSize } from "../lib/hooks"
import detectScrollbarWidth from "../lib/scrollbar-width"
import { ParticipantExtra, SerologyExtra, TitreChange } from "../lib/table-data"
import { Virus } from "../lib/data"
import { interpolateSinebow } from "d3"
import { scaleOrdinal, scaleLog, scaleLinear } from "d3-scale"
import { ControlRibbon, Selector, SelectorMultiple } from "./control-ribbon"

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
    (d) => d.virusShortName,
    (d) => d.prevVac
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
    ([virus, vacSummary]) =>
      Array.from(vacSummary, ([prevVac, summary]) => ({
        ...summary,
        virus,
        prevVac,
      }))
  )
    .flat()
    .sort((a, b) => a.prevVac - b.prevVac)
    .sort((a, b) => (a.virus > b.virus ? 1 : a.virus < b.virus ? -1 : 0))

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
            yTitle: 20,
            xTitle: 20,
          }}
          categorySeparatorXLevel={0}
        />
        <PointRange
          data={titreChangesPlot}
          xAccessor={(d) => [d.virus, d.prevVac.toString()]}
          yAccessor={(d) => ({ point: d.mean, low: d.low, high: d.high })}
          minWidthPerX={20}
          maxWidthMultiplier={3}
          height={400}
          yAxisSpec={{
            min: 0.5,
            max: 30,
            ticks: [0.5, 1, 2, 5, 10, 20, 30],
            lab: selectedPid ? "Fold-rise (14 vs 0)" : "GMR (14 vs 0, 95% CI)",
          }}
          xAxisSpec={[
            {
              textAnchor: "start",
              angle: 45,
              renderTick: (props) => (
                <VirusTick {...props} viruses={virusTable} />
              ),
            },
            { name: "Vax" },
          ]}
          pad={{
            axis: { top: 10, bottom: 150, left: 55, right: 80 },
            data: { top: 0, right: 0, bottom: 10, left: 10 },
            yTitle: 20,
            xTitle: 20,
          }}
          categorySeparatorXLevel={0}
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
          getColorVariable={(p) => p.prevVac.toString() ?? "(missing)"}
        />
      </PlotContainer>
    </>
  )
}

function PlotColumn({
  participantsExtra,
  getColorVariable,
}: {
  participantsExtra: ParticipantExtra[]
  getColorVariable: (p: ParticipantExtra) => string
}) {
  const colorVarValues = Array.from(
    new Set(participantsExtra.map(getColorVariable))
  )
  const colorMapping = createDescreteMapping(colorVarValues)
  const colorVarSort = (a: any, b: any) => {
    if (a.colorVar === "(missing)") {
      return 1
    }
    if (b.colorVar === "(missing)") {
      return -1
    }
    return a.colorVar > b.colorVar ? 1 : a.colorVar < b.colorVar ? -1 : 0
  }

  const genderCounts = d3.rollup(
    participantsExtra,
    (v) => v.length,
    (p) => p.gender,
    getColorVariable
  )

  const priorVaccinationCounts = d3.rollup(
    participantsExtra,
    (v) => v.length,
    (p) => p.prevVac,
    getColorVariable
  )

  function binAges(arr: number[]) {
    const thresholds = [18, 30, 40, 50, 66]
    const thresholdsReverse = [...thresholds].reverse()
    const closeLow = (v: number) =>
      thresholdsReverse[thresholdsReverse.findIndex((t) => t <= v)]
    const closeHigh = (v: number) =>
      thresholds[thresholds.findIndex((t) => t >= v)]
    return d3
      .bin()
      .thresholds(thresholds)(arr)
      .filter((a) => a.length > 0)
      .map((a) => ({
        range:
          a.x0! < 18
            ? "<18"
            : a.x0! === 66
            ? `>=66`
            : `${closeLow(a.x0!)}-${closeHigh(a.x1!)}`,
        count: a.length,
      }))
  }

  const agesBinned = colorVarValues
    .map((colorVarValue) => {
      const dataSubset = participantsExtra.filter(
        (p) => getColorVariable(p) === colorVarValue
      )
      return binAges(dataSubset.map((p) => p.age)).map((x) =>
        Object.assign(x, {
          colorVar: colorVarValue,
        })
      )
    })
    .flat()
    .sort(colorVarSort)

  const genderCountsArray = Array.from(genderCounts, ([gender, colorSummary]) =>
    Array.from(colorSummary, ([colorVar, count]) => ({
      gender: gender ?? "(missing)",
      colorVar,
      count,
    }))
  )
    .flat()
    .sort(colorVarSort)

  const priorVacArray = Array.from(
    priorVaccinationCounts,
    ([prevVac, colorSummary]) =>
      Array.from(colorSummary, ([colorVar, count]) => ({
        priorVaccinations: prevVac ?? "(missing)",
        colorVar,
        count,
      })).sort(colorVarSort)
  )
    .flat()
    .sort((a, b) => a.priorVaccinations - b.priorVaccinations)

  const getColor = (d: any) => colorMapping[d.colorVar]
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <GenericBar
        data={agesBinned}
        yAccessor={(d) => d.count}
        xAccessor={(d) => d.range}
        yAxisSpec={{
          lab: "Count",
        }}
        xAxisSpec={{
          lab: "Age",
        }}
        getColor={getColor}
      />
      <GenericBar
        data={genderCountsArray}
        yAccessor={(d) => d.count}
        xAccessor={(d) => d.gender}
        yAxisSpec={{
          lab: "Count",
        }}
        xAxisSpec={{
          lab: "Gender",
        }}
        getColor={getColor}
      />
      <GenericBar
        data={priorVacArray}
        yAccessor={(d) => d.count}
        xAccessor={(d) => d.priorVaccinations.toString()}
        yAxisSpec={{
          lab: "Count",
        }}
        xAxisSpec={{
          lab: "Known prior vaccinations",
        }}
        getColor={getColor}
      />
    </div>
  )
}

function seq(start: number, end: number, step: number): number[] {
  const res = []
  for (let i = start; i <= end; i += step) {
    res.push(i)
  }
  return res
}

function magnitudeOf(x: number): number {
  return x.toFixed().length - 1
}

function roundUp(x: number) {
  const mag = magnitudeOf(x)
  const multiplier = Math.pow(10, mag)
  const down = x - (x % multiplier)
  return down + multiplier
}

function isOverHalf(x: number) {
  return parseInt(x.toFixed()[0]) >= 5
}

function GenericBar<T extends Object>({
  data,
  yAccessor,
  xAccessor,
  minWidthPerX = 50,
  maxWidthMultiplier = 1,
  height = 200,
  pad = {
    axis: { top: 20, right: 0, bottom: 40, left: 50 },
    data: { top: 0, right: 30, bottom: 0, left: 30 },
    yTitle: 15,
    xTitle: 5,
  },
  yAxisSpec,
  xAxisSpec,
  getColor,
}: {
  data: T[]
  yAccessor: (x: T) => number
  xAccessor: (x: T) => string
  minWidthPerX?: number
  maxWidthMultiplier?: number
  height?: number
  pad?: PlotPad
  yAxisSpec: AxisSpec
  xAxisSpec: AxisSpec
  getColor?: (d: T) => string
}) {
  const xValuesUnique = Array.from(new Set(data.map(xAccessor)))
  const { width, widthPerX } = usePlotSize({
    uniqueXCount: xValuesUnique.length,
    minWidthPerX: minWidthPerX,
    maxWidthMultiplier: maxWidthMultiplier,
    pad,
  })
  const scaleX = scaleCategorical(xValuesUnique, [
    pad.axis.left + pad.data.left,
    width - pad.axis.right - pad.data.right,
  ])
  const yValuesSum = data.map((d) => yAccessor(d))
  const yMax = yAxisSpec.max ?? d3.max(yValuesSum) ?? 100
  const yMaxRounded = roundUp(yMax)
  const scaleY = scaleLinear(
    [yAxisSpec.min ?? 0, yMaxRounded],
    [height - pad.axis.bottom - pad.data.bottom, pad.axis.top + pad.data.top]
  )
  const theme = useTheme()
  const barWidth = widthPerX * 0.8
  return (
    <SinglePlotContainer height={height}>
      <svg width={width} height={height}>
        <Axis
          pad={pad}
          height={height}
          width={width}
          label={yAxisSpec.lab}
          ticks={
            yAxisSpec.ticks ??
            seq(
              yAxisSpec.min ?? 0,
              yMaxRounded,
              Math.pow(10, magnitudeOf(yMax)) /
                (isOverHalf(yMaxRounded) ? 1 : 2)
            )
          }
          scale={scaleY}
          orientation="vertical"
          drawGrid
        />
        <Axis
          pad={pad}
          height={height}
          width={width}
          label={xAxisSpec.lab}
          ticks={xValuesUnique}
          scale={scaleX}
          orientation="horizontal"
          drawGrid={false}
        />
        {xValuesUnique.map((xValue, i) => {
          const dataSubset = data.filter((d) => xAccessor(d) === xValue)
          const cumY = d3.cumsum(dataSubset.map(yAccessor)).map(scaleY)
          return dataSubset.map((d, j) => (
            <rect
              key={`bar-${i}-${j}`}
              x={scaleX(xValue) - barWidth / 2}
              y={cumY[j]}
              width={barWidth}
              height={
                height -
                scaleY(yAccessor(d)) -
                pad.axis.bottom -
                pad.data.bottom
              }
              fill={
                getColor?.(d) ??
                theme.palette.primary[
                  theme.palette.type === "dark" ? "light" : "dark"
                ]
              }
            />
          ))
        })}
      </svg>
    </SinglePlotContainer>
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

type Pad = {
  top: number
  bottom: number
  left: number
  right: number
}

type PlotPad = {
  axis: Pad
  data: Pad
  yTitle: number
  xTitle: number
}

function usePlotSize({
  uniqueXCount,
  minWidthPerX,
  maxWidthMultiplier,
  pad,
}: {
  uniqueXCount: number
  minWidthPerX: number
  maxWidthMultiplier: number
  pad: PlotPad
}) {
  const minWidth =
    minWidthPerX * uniqueXCount +
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
  const widthPerX = dataWidth / uniqueXCount
  return {
    width,
    widthPerX,
  }
}

type AxisSpec = {
  min?: number
  max?: number
  ticks?: number[]
  lab: string
}

function scaleCategorical(
  levels: (string | string[])[],
  [min, max]: [min: number, max: number]
) {
  const scaleIndex = scaleLinear([0, levels.length - 1], [min, max])
  return scaleOrdinal(
    levels,
    levels.map((x, i) => scaleIndex(i))
  )
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
  yAxisSpec: AxisSpec
  getColor?: (x: T) => string
  xAxisSpec: {
    name?: string
    textAnchor?: "middle" | "start"
    angle?: number
    renderTick?: (props: { tick: string; x: number; y: number }) => ReactNode
  }[]
  categorySeparatorXLevel?: number
  pad: PlotPad
}) {
  // Figure out plot dimensions (data-dependent)
  const uniqueXs = Array.from(new Set(data.map((x) => xAccessor(x))))
  const { width, widthPerX } = usePlotSize({
    uniqueXCount: uniqueXs.length,
    minWidthPerX,
    maxWidthMultiplier,
    pad,
  })

  const scaleX = scaleCategorical(uniqueXs, [
    pad.axis.left + pad.data.left,
    width - pad.axis.right - pad.data.right,
  ])

  const scaleY = scaleLog(
    [yAxisSpec.min ?? 5, yAxisSpec.max ?? 10000],
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
  const xAxesDistance = 15
  return (
    <SinglePlotContainer height={height}>
      <svg width={width} height={height}>
        {/* Category separators */}
        {xSep.map((x, i) => {
          const x1 = scaleX(x) - widthPerX / 2
          const x2 =
            scaleX(
              i === xSep.length - 1
                ? uniqueXs[uniqueXs.length - 1]
                : xSep[i + 1]
            ) +
            (widthPerX / 2) * (i === xSep.length - 1 ? 0 : -1)

          return (
            <rect
              key={`separator-${i}`}
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
        <Axis
          pad={pad}
          height={height}
          width={width}
          label={yAxisSpec.lab}
          ticks={yAxisSpec.ticks ?? []}
          scale={scaleY}
          orientation="vertical"
          drawGrid
        />
        {/* X-axis */}
        {/* Line */}
        <StraightLine
          x1={pad.axis.left}
          x2={width - pad.axis.right}
          y={height - pad.axis.bottom}
          color={theme.plot.axis}
        />
        {/* Name(s) */}
        {xAxisSpec?.map((xAxis, i) => (
          <text
            key={`axis-${i}`}
            x={pad.axis.left}
            y={
              height -
              pad.axis.bottom +
              theme.plot.tickLength +
              theme.plot.tickLabelFromTick +
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
                  theme.plot.tickLength +
                  theme.plot.tickLabelFromTick +
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
              <StraightLine
                x={x}
                y1={height - pad.axis.bottom + theme.plot.tickLength}
                y2={height - pad.axis.bottom}
                color={theme.plot.axis}
              />
              {/* Grid line */}
              <StraightLine
                x={x}
                y1={height - pad.axis.bottom}
                y2={pad.axis.top}
                color={theme.plot.grid}
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
    </SinglePlotContainer>
  )
}

function StraightLine({
  x,
  x1,
  x2,
  y,
  y1,
  y2,
  color,
}: {
  x?: number
  x1?: number
  x2?: number
  y?: number
  y1?: number
  y2?: number
  color: string
}) {
  if (x) {
    return <line x1={x} x2={x} y1={y1} y2={y2} stroke={color} />
  }
  return <line x1={x1} x2={x2} y1={y} y2={y} stroke={color} />
}

function SinglePlotContainer({
  children,
  height,
}: {
  children: ReactNode
  height: number
}) {
  return (
    <div
      style={{
        overflowX: "scroll",
        overflowY: "hidden",
        height: height + detectScrollbarWidth(),
      }}
    >
      {children}
    </div>
  )
}

function Axis<T>({
  pad,
  height,
  width,
  label,
  ticks,
  scale,
  orientation,
  drawGrid,
}: {
  pad: PlotPad
  height: number
  width: number
  label: string
  ticks: T[]
  scale: (x: T) => number
  orientation: "horizontal" | "vertical"
  drawGrid: boolean
}) {
  const isX = orientation === "horizontal"
  const axisTitle = [
    isX
      ? (width - pad.axis.left - pad.axis.right) / 2 + pad.axis.left
      : pad.yTitle,
    isX
      ? height - pad.xTitle
      : (height - pad.axis.top - pad.axis.bottom) / 2 + pad.axis.top,
  ]
  const theme = useTheme()
  return (
    <>
      {/* Line */}
      <StraightLine
        x={isX ? undefined : pad.axis.left}
        x1={isX ? pad.axis.left : undefined}
        x2={isX ? width - pad.axis.right : undefined}
        y={isX ? height - pad.axis.bottom : undefined}
        y1={isX ? undefined : height - pad.axis.bottom}
        y2={isX ? undefined : pad.axis.top}
        color={theme.plot.axis}
      />
      {/* Name */}
      <text
        x={axisTitle[0]}
        y={axisTitle[1]}
        fill={theme.palette.text.primary}
        textAnchor="middle"
        transform={isX ? "" : `rotate(-90, ${axisTitle[0]}, ${axisTitle[1]})`}
      >
        {label}
        {/* Ticks */}
      </text>
      {ticks.map((tick, i) => {
        const coordinate = scale(tick)
        const maxAllowed = isX ? width - pad.axis.right : pad.axis.top
        if (isX ? coordinate > maxAllowed : coordinate < maxAllowed) {
          return <g key={`${isX ? "x" : "y"}-tick-${i}`} />
        }
        return (
          <g key={`${isX ? "x" : "y"}-tick-${i}`}>
            {/* Number */}
            <text
              fill={theme.palette.text.secondary}
              x={
                isX
                  ? coordinate
                  : pad.axis.left -
                    theme.plot.tickLength -
                    theme.plot.tickLabelFromTick
              }
              y={
                isX
                  ? height -
                    (pad.axis.bottom -
                      theme.plot.tickLength -
                      theme.plot.tickLabelFromTick)
                  : coordinate
              }
              textAnchor={isX ? "middle" : "end"}
              dominantBaseline={isX ? "hanging" : "middle"}
            >
              {tick}
            </text>
            {/* Tick */}
            <StraightLine
              x1={isX ? undefined : pad.axis.left - theme.plot.tickLength}
              x2={isX ? undefined : pad.axis.left}
              y={isX ? undefined : coordinate}
              x={isX ? coordinate : undefined}
              y1={isX ? height - pad.axis.bottom : undefined}
              y2={
                isX
                  ? height - pad.axis.bottom + theme.plot.tickLength
                  : undefined
              }
              color={theme.plot.axis}
            />
            {/* Grid line */}
            {drawGrid && (
              <StraightLine
                x1={isX ? undefined : pad.axis.left}
                x2={isX ? undefined : width - pad.axis.right}
                y={isX ? undefined : coordinate}
                x={isX ? coordinate : undefined}
                y1={isX ? height - pad.axis.bottom : undefined}
                y2={isX ? pad.axis.top : undefined}
                color={theme.plot.grid}
              />
            )}
          </g>
        )
      })}
    </>
  )
}
