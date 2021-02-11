import { useTheme } from "@material-ui/core"
import React, { ReactNode, useState } from "react"
import { Route, useRouteMatch, Switch, Redirect } from "react-router-dom"
import { SimpleNav } from "./nav"
import ScreenHeight from "./screen-height"
import { useWindowSize } from "../lib/hooks"
import detectScrollbarWidth from "../lib/scrollbar-width"
import { ParticipantExtra, SerologyExtra, TitreChange } from "../lib/table-data"
import { Site, Virus } from "../lib/data"
import {
  ControlRibbon,
  Selector,
  SelectorMultiple,
  SiteSelect,
} from "./control-ribbon"
import {
  cut,
  numberSort,
  rollup,
  stringSort,
  unique,
  summariseLogmean,
  summariseProportion,
  getSum,
  scaleLinear,
  scaleLog,
  scaleOrdinal,
  interpolateSinebow,
  getCumsum,
  getMax,
  rangeSort,
  getMin,
  filterNotNull,
} from "../lib/util"

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
  const uniqueSites = unique(serology.map((s) => s.site)).sort(stringSort)
  const uniqueDays = unique(serology.map((s) => s.day)).sort(numberSort)
  const uniqueVax = unique(serology.map((s) => s.prevVac)).sort(numberSort)
  const uniqueViruses = virusTable.map((v) => v.name)

  // Coloring based on unique for consistency
  const colorsDays = createDescreteMapping(uniqueDays)

  // Filters applied in the order presented
  const [selectedSites, setSelectedSites] = useState<Site[]>([])
  const [selectedVax, setSelectedVax] = useState<number[]>([0, 5])

  // Site and vax determine the selection of pid and set it to null
  // Pid always sets site and vax to 1 value each
  const [selectedPid, setSelectedPid] = useState<string | null>(null)

  const [selectedViruses, setSelectedViruses] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 14])

  const siteFiltered = serology.filter(
    (s) => selectedSites.length === 0 || selectedSites.includes(s.site)
  )

  const vacFiltered = siteFiltered.filter(
    (s) => selectedVax.length === 0 || selectedVax.includes(s.prevVac)
  )

  const availablePids = unique(vacFiltered.map((s) => s.pid)).sort(stringSort)
  const pidFiltered = vacFiltered.filter(
    (s) => !selectedPid || s.pid === selectedPid
  )

  const virusFiltered = pidFiltered.filter(
    (s) => selectedViruses.length === 0 || selectedViruses.includes(s.virus)
  )

  const daysFiltered = virusFiltered.filter(
    (s) => selectedDays.length === 0 || selectedDays.includes(s.day)
  )

  const titreChangeFiltered = titreChange.filter(
    (t) =>
      (selectedPid === null
        ? availablePids.includes(t.pid)
        : t.pid === selectedPid) &&
      (selectedViruses.length === 0 || selectedViruses.includes(t.virus))
  )

  // Summarise the filtered data

  // Serology (GMT's for virus/day/vax)
  const serologySummary = rollup(
    daysFiltered,
    (x) => ({
      virusShortName: x.virusShortName,
      day: x.day,
      prevVac: x.prevVac,
    }),
    (arr) => summariseLogmean(arr.map((x) => x.titre))
  )
    .sort((a, b) => numberSort(a.prevVac, b.prevVac))
    .sort((a, b) => numberSort(a.day, b.day))
    .sort((a, b) => stringSort(a.virusShortName, b.virusShortName))

  // Seroconversion (for virus/vax)
  const seroconversionSummary = rollup(
    titreChangeFiltered,
    (x) => ({ prevVac: x.prevVac, virusShortName: x.virusShortName }),
    (arr) => summariseProportion(arr.map((a) => a.seroconverted))
  )
    .sort((a, b) => numberSort(a.prevVac, b.prevVac))
    .sort((a, b) => stringSort(a.virusShortName, b.virusShortName))

  // Titre rises (virus/vax)
  const titreChangesSummary = rollup(
    titreChangeFiltered,
    (x) => ({ virusShortName: x.virusShortName, prevVac: x.prevVac }),
    (arr) => summariseLogmean(arr.map((v) => v.rise))
  )
    .sort((a, b) => numberSort(a.prevVac, b.prevVac))
    .sort((a, b) => stringSort(a.virusShortName, b.virusShortName))

  const pad = {
    axis: { top: 10, bottom: 150, left: 55, right: 80 },
    data: { top: 0, right: 0, bottom: 10, left: 10 },
    yTitle: 20,
    xTitle: 20,
  }
  function virusAxisSpec<T extends { virusShortName: string }>() {
    if (selectedViruses.length === 1) {
      return null
    }
    return {
      textAnchor: "start",
      angle: 45,
      renderTick: (props) => <VirusTick {...props} viruses={virusTable} />,
      accessor: (d) => d.virusShortName,
    } as AxisSpec<T, string>
  }
  function vaxAxisSpec<T extends { prevVac: number }>() {
    if (selectedVax.length === 1) {
      return null
    }
    return { lab: "Vax", accessor: (d: T) => d.prevVac.toString() }
  }
  const titreTicks = [5, 10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120, 10240]
  const perVirus =
    selectedViruses.length === 1
      ? `for ${selectedViruses[0]} virus`
      : "per virus"
  const perDay =
    selectedDays.length === 1 ? `for day ${selectedDays[0]}` : "per day"
  const perVax =
    selectedVax.length === 1
      ? `for the group with ${selectedVax[0]} prior vaccination`
      : "per prior vaccination count"
  return (
    <>
      <ControlRibbon>
        <SiteSelect
          sites={uniqueSites}
          site={selectedSites}
          setSite={(s) => {
            setSelectedSites(s)
            setSelectedPid(null)
          }}
        />
        <SelectorMultiple
          options={uniqueVax}
          label="Vaccinations"
          value={selectedVax}
          onChange={(n) => {
            setSelectedVax(n)
            setSelectedPid(null)
          }}
          width={200}
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
              setSelectedSites([thisPid.site])
            }
            if (thisPid?.prevVac !== undefined) {
              setSelectedVax([thisPid.prevVac])
            }
          }}
          inputMode="text"
        />
        <SelectorMultiple
          options={uniqueViruses}
          label="Virus"
          width={225}
          value={selectedViruses}
          onChange={setSelectedViruses}
          inputMode="none"
        />
        <SelectorMultiple
          options={uniqueDays}
          label="Day"
          width={200}
          value={selectedDays}
          onChange={setSelectedDays}
          inputMode="none"
        />
      </ControlRibbon>
      <PlotContainer>
        <FigureContainer>
          <PointRange
            data={serologySummary}
            minWidthPerX={20}
            maxWidthMultiplier={3}
            height={500}
            yAxisSpec={{
              min: titreTicks[0],
              max: titreTicks[titreTicks.length - 1],
              ticks: titreTicks,
              lab: selectedPid ? "Titre" : "GMT (95% CI)",
              type: "log",
              accessor: (d) => ({ point: d.mean, low: d.low, high: d.high }),
            }}
            getColor={(v) => colorsDays[v.day]}
            xAxesSpec={[
              virusAxisSpec(),
              selectedDays.length === 1
                ? null
                : { lab: "Day", accessor: (d) => d.day.toString() },
              vaxAxisSpec(),
            ]}
            pad={pad}
            categorySeparatorXLevel={0}
          />
          <Caption>
            {selectedPid
              ? `${selectedPid} titre measurements`
              : "Geometric mean titres with 95% CIs"}{" "}
            {perVirus} {perDay}
            {selectedPid === null && " " + perVax}
            {". "}
            Colored by day.{" "}
            {selectedVax.length !== 1
              ? `Arranged so that points with the same color form groups
              ${selectedViruses.length !== 1 ? "(within each virus panel)" : ""}
              representing the same GMT (same virus, same day) for different
              sample subsets split by vaccination history.`
              : ""}
          </Caption>
        </FigureContainer>
        <FigureContainer>
          <PointRange
            data={titreChangesSummary}
            minWidthPerX={20}
            maxWidthMultiplier={3}
            height={400}
            yAxisSpec={{
              min: Math.min(0.5, getMin(titreChangesSummary.map((d) => d.low))),
              max: Math.max(30, getMax(titreChangesSummary.map((d) => d.high))),
              ticks: [0.5, 1, 2, 5, 10, 20, 30],
              lab: selectedPid
                ? "Fold-rise (14 vs 0)"
                : "GMR (14 vs 0, 95% CI)",
              type: "log",
              accessor: (d) => ({ point: d.mean, low: d.low, high: d.high }),
            }}
            xAxesSpec={[virusAxisSpec(), vaxAxisSpec()]}
            pad={pad}
            categorySeparatorXLevel={0}
          />
          <Caption>
            {selectedPid
              ? `${selectedPid} titre rises`
              : "Geometric mean rises with 95% CIs"}{" "}
            between day 0 and 14 {perVirus}
            {selectedPid === null && " " + perVax}.
          </Caption>
        </FigureContainer>
        <FigureContainer>
          <PointRange
            data={seroconversionSummary}
            minWidthPerX={20}
            maxWidthMultiplier={3}
            height={400}
            yAxisSpec={{
              min: 0,
              max: 1,
              ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
              lab: selectedPid
                ? "Seroconverted (14 vs 0)"
                : "Seroconversion (14 vs 0, 95% CI)",
              accessor: (d) => ({ point: d.prop, low: d.low, high: d.high }),
            }}
            xAxesSpec={[virusAxisSpec(), vaxAxisSpec()]}
            pad={pad}
            categorySeparatorXLevel={0}
          />
          <Caption>
            {selectedPid
              ? `Whether ${selectedPid} seroconverted (1) or not (0)`
              : "Proportions seroconverted with 95% CIs (normal approximation)"}{" "}
            between day 0 and 14 {perVirus}
            {selectedPid === null && " " + perVax}. Seroconversion defined as
            day 14 titre of at least 40 if day 0 titre is 5, at least a 4-fold
            rise otherwise.
          </Caption>
        </FigureContainer>
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
  const [site, setSite] = useState<Site[]>([])
  type ColorVariable =
    | "gender"
    | "prevVac"
    | "ageCat"
    | "heightCat"
    | "weightCat"
    | "bmiCat"
  const [colorVariable, setColorVariable] = useState<ColorVariable | null>(null)

  const ageThresholds = [18, 30, 40, 50, 66]
  const heightThresholds = [150, 160, 170, 180, 190]
  const weightThresholds = [50, 70, 90, 110]
  const bmiThresholds = [15, 18, 25, 30, 40]

  const options = {
    gender: {
      lab: "Gender",
      getter: (p: ParticipantExtra) => p.gender ?? "(missing)",
      sorter: stringSort,
    },
    prevVac: {
      lab: "Vaccination",
      getter: (p: ParticipantExtra) => p.prevVac.toString(),
      sorter: stringSort,
    },
    ageCat: {
      lab: "Age",
      getter: (p: ParticipantExtra) =>
        cut(p.age, { thresholds: ageThresholds }).string,
      sorter: rangeSort,
    },
    heightCat: {
      lab: "Height",
      getter: (p: ParticipantExtra) =>
        cut(p.heightCM, { thresholds: heightThresholds }).string,
      sorter: rangeSort,
    },
    weightCat: {
      lab: "Weight",
      getter: (p: ParticipantExtra) =>
        cut(p.weightKG, { thresholds: weightThresholds }).string,
      sorter: rangeSort,
    },
    bmiCat: {
      lab: "BMI",
      getter: (p: ParticipantExtra) =>
        cut(p.bmi, { thresholds: bmiThresholds }).string,
      sorter: rangeSort,
    },
  }
  return (
    <>
      <ControlRibbon>
        <SiteSelect sites={sites} site={site} setSite={setSite} />
        <Selector
          options={[
            "ageCat",
            "heightCat",
            "weightCat",
            "bmiCat",
            "gender",
            "prevVac",
          ]}
          getOptionLabel={(o) => options[o as ColorVariable].lab}
          label="Color by"
          value={colorVariable}
          onChange={setColorVariable}
          width={200}
          inputMode="none"
        />
      </ControlRibbon>
      <PlotContainer>
        <PlotColumn
          participantsExtra={participantsExtra.filter(
            (p) =>
              site.length === 0 ||
              (p.site !== undefined && site.includes(p.site))
          )}
          getColorVariable={
            colorVariable
              ? (p) => options[colorVariable].getter(p)
              : (p) => "constant"
          }
          sortColorVariable={
            colorVariable ? options[colorVariable].sorter : stringSort
          }
          ageThresholds={ageThresholds}
          heightThresholds={heightThresholds}
          weightThresholds={weightThresholds}
          bmiThresholds={bmiThresholds}
        />
      </PlotContainer>
    </>
  )
}

function PlotColumn({
  participantsExtra,
  getColorVariable,
  sortColorVariable,
  ageThresholds,
  heightThresholds,
  weightThresholds,
  bmiThresholds,
}: {
  participantsExtra: ParticipantExtra[]
  getColorVariable: (p: ParticipantExtra) => string
  sortColorVariable: (a: string, b: string) => number
  ageThresholds: number[]
  heightThresholds: number[]
  weightThresholds: number[]
  bmiThresholds: number[]
}) {
  const colorVarValues = Array.from(
    new Set(participantsExtra.map(getColorVariable))
  )
  const colorMapping = createDescreteMapping(colorVarValues)

  const genderCounts = rollup(
    participantsExtra,
    (x) => ({ gender: x.gender ?? "(missing)", colorVar: getColorVariable(x) }),
    (v) => ({ count: v.length })
  )
    .sort((a, b) => sortColorVariable(a.colorVar, b.colorVar))
    .sort((a, b) => stringSort(a.gender, b.gender))

  const priorVaccinationCounts = rollup(
    participantsExtra,
    (x) => ({ prevVac: x.prevVac, colorVar: getColorVariable(x) }),
    (v) => ({ count: v.length })
  )
    .sort((a, b) => sortColorVariable(a.colorVar, b.colorVar))
    .sort((a, b) => numberSort(a.prevVac, b.prevVac))

  const agesBinned = rollup(
    participantsExtra,
    (p) => ({
      colorVar: getColorVariable(p),
      ageCat: cut(p.age, { thresholds: ageThresholds }).string,
    }),
    (subset) => ({ count: subset.length })
  )
    .sort((a, b) => sortColorVariable(a.colorVar, b.colorVar))
    .sort((a, b) => rangeSort(a.ageCat, b.ageCat))

  const heightBinned = rollup(
    participantsExtra,
    (p) => ({
      colorVar: getColorVariable(p),
      heightCat: cut(p.heightCM, { thresholds: heightThresholds }).string,
    }),
    (subset) => ({ count: subset.length })
  )
    .sort((a, b) => sortColorVariable(a.colorVar, b.colorVar))
    .sort((a, b) => rangeSort(a.heightCat, b.heightCat))

  const weightBinned = rollup(
    participantsExtra,
    (p) => ({
      colorVar: getColorVariable(p),
      weightCat: cut(p.weightKG, { thresholds: weightThresholds }).string,
    }),
    (subset) => ({ count: subset.length })
  )
    .sort((a, b) => sortColorVariable(a.colorVar, b.colorVar))
    .sort((a, b) => rangeSort(a.weightCat, b.weightCat))

  const bmiBinned = rollup(
    participantsExtra,
    (p) => ({
      colorVar: getColorVariable(p),
      bmiCat: cut(p.bmi, { thresholds: bmiThresholds }).string,
    }),
    (subset) => ({ count: subset.length })
  )
    .sort((a, b) => sortColorVariable(a.colorVar, b.colorVar))
    .sort((a, b) => rangeSort(a.bmiCat, b.bmiCat))

  const theme = useTheme()
  const getColor = (d: any) =>
    colorVarValues.length === 1
      ? theme.palette.primary[theme.palette.type === "dark" ? "light" : "dark"]
      : colorMapping[d.colorVar]
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <GenericBar
        data={agesBinned}
        yAxisSpec={{
          lab: "Count",
          accessor: (d) => d.count,
        }}
        xAxisSpec={{
          lab: "Age",
          accessor: (d) => d.ageCat,
        }}
        getColor={getColor}
      />
      <GenericBar
        data={heightBinned}
        yAxisSpec={{
          lab: "Count",
          accessor: (d) => d.count,
        }}
        xAxisSpec={{
          lab: "Height, cm",
          accessor: (d) => d.heightCat,
        }}
        getColor={getColor}
      />
      <GenericBar
        data={weightBinned}
        yAxisSpec={{
          lab: "Count",
          accessor: (d) => d.count,
        }}
        xAxisSpec={{
          lab: "Weight, kg",
          accessor: (d) => d.weightCat,
        }}
        getColor={getColor}
      />
      <GenericBar
        data={bmiBinned}
        yAxisSpec={{
          lab: "Count",
          accessor: (d) => d.count,
        }}
        xAxisSpec={{
          lab: "BMI",
          accessor: (d) => d.bmiCat,
        }}
        getColor={getColor}
      />
      <GenericBar
        data={genderCounts}
        yAxisSpec={{
          lab: "Count",
          accessor: (d) => d.count,
        }}
        xAxisSpec={{
          lab: "Gender",
          accessor: (d) => d.gender,
        }}
        getColor={getColor}
      />
      <GenericBar
        data={priorVaccinationCounts}
        yAxisSpec={{
          lab: "Count",
          accessor: (d) => d.count,
        }}
        xAxisSpec={{
          lab: "Known prior vaccinations",
          accessor: (d) => d.prevVac.toString(),
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
  fixedWidth = 350,
  fixedBarWidth = 50,
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
  fixedWidth?: number
  fixedBarWidth?: number
  height?: number
  pad?: PlotPad
  yAxisSpec: AxisSpec<T, number>
  xAxisSpec: AxisSpec<T, string>
  getColor?: (d: T) => string
}) {
  const xValuesUnique = Array.from(new Set(data.map(xAxisSpec.accessor)))
  const xValueSubsets = xValuesUnique.map((xValue) => {
    const dataSubset = data.filter((d) => xAxisSpec.accessor(d) === xValue)
    const yValues = dataSubset.map(yAxisSpec.accessor)
    return {
      xValue,
      total: getSum(yValues),
      dataSubset,
      cumsum: getCumsum(yValues),
    }
  })
  const { width } = usePlotSize({
    fixedWidth,
    pad,
  })
  const scaleX = (x: string) =>
    scaleOrdinal(x, xValuesUnique, [
      pad.axis.left + pad.data.left,
      width - pad.axis.right - pad.data.right,
    ])
  const yValuesSum = xValueSubsets.map((d) => d.total)
  const yMax = yAxisSpec.max ?? getMax(yValuesSum)
  const yMaxRounded = roundUp(yMax)
  const scaleY = (x: number) =>
    scaleLinear(
      x,
      [yAxisSpec.min ?? 0, yMaxRounded],
      [height - pad.axis.bottom - pad.data.bottom, pad.axis.top + pad.data.top]
    )
  const theme = useTheme()
  const barWidth = fixedBarWidth
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
        {xValueSubsets.map((xValueSubset, i) =>
          xValueSubset.dataSubset.map((d, j) => (
            <rect
              key={`bar-${i}-${j}`}
              x={scaleX(xValueSubset.xValue) - barWidth / 2}
              y={scaleY(xValueSubset.cumsum[j])}
              width={barWidth}
              height={
                height -
                scaleY(yAxisSpec.accessor(d)) -
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
        )}
      </svg>
    </SinglePlotContainer>
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
  fixedWidth,
  uniqueXCount,
  minWidthPerX,
  maxWidthMultiplier,
  pad,
}: {
  fixedWidth?: number
  uniqueXCount?: number
  minWidthPerX?: number
  maxWidthMultiplier?: number
  pad: PlotPad
}) {
  const windowSize = useWindowSize()

  let minWidth: number =
    pad.axis.left + pad.axis.right + pad.data.left + pad.data.right

  if (!fixedWidth && !minWidthPerX) {
    minWidth += 300
  } else if (!fixedWidth) {
    minWidth += (minWidthPerX ?? 100) * (uniqueXCount ?? 5)
  } else {
    minWidth += fixedWidth
  }

  const width =
    minmax(windowSize.width, minWidth, minWidth * (maxWidthMultiplier ?? 1)) -
    detectScrollbarWidth()
  const dataWidth =
    width - pad.axis.right - pad.data.right - pad.axis.left - pad.data.left
  const widthPerX = dataWidth / (uniqueXCount ?? 5)
  return {
    width,
    widthPerX,
  }
}

type AxisSpec<T extends Object, K> = {
  min?: number
  max?: number
  ticks?: number[]
  lab?: string
  type?: "linear" | "log"
  textAnchor?: "middle" | "start"
  angle?: number
  renderTick?: (props: { tick: string; x: number; y: number }) => ReactNode
  accessor: (x: T) => K
}

function PointRange<T extends Object>({
  data,
  minWidthPerX,
  maxWidthMultiplier,
  height,
  yAxisSpec,
  getColor,
  xAxesSpec,
  categorySeparatorXLevel,
  pad,
}: {
  data: T[]
  minWidthPerX: number
  maxWidthMultiplier: number
  height: number
  yAxisSpec: AxisSpec<T, { point: number; low: number; high: number }>
  getColor?: (x: T) => string
  xAxesSpec: (AxisSpec<T, string> | null)[]
  categorySeparatorXLevel?: number
  pad: PlotPad
}) {
  const xAxesNotNull = xAxesSpec.filter(filterNotNull)
  const xAccessor = (d: T) =>
    xAxesNotNull.length === 0
      ? [""]
      : xAxesNotNull.map((xAxis) => xAxis.accessor(d))

  // Figure out plot dimensions (data-dependent)
  const uniqueXs = Array.from(new Set(data.map((x) => xAccessor(x))))
  const { width, widthPerX } = usePlotSize({
    uniqueXCount: uniqueXs.length,
    minWidthPerX,
    maxWidthMultiplier,
    pad,
  })

  const scaleX = (x: string[]) =>
    scaleOrdinal(
      x.join(""),
      uniqueXs.map((x) => x.join("")),
      [pad.axis.left + pad.data.left, width - pad.axis.right - pad.data.right]
    )

  const scaleY = (x: number) =>
    (yAxisSpec.type === "log" ? scaleLog : scaleLinear)(
      x,
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
        {xAxesNotNull.map((xAxis, i) => (
          <text
            key={`axis-${i}`}
            x={pad.axis.left}
            y={
              height -
              pad.axis.bottom +
              theme.plot.tickLength +
              theme.plot.tickLabelFromTick +
              (xAxesNotNull.length - i - 1) * xAxesDistance
            }
            fill={theme.palette.text.primary}
            textAnchor="end"
            dominantBaseline="hanging"
          >
            {xAxis.lab}
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
                      textAnchor={xAxesNotNull[j]?.textAnchor ?? "middle"}
                      dominantBaseline="hanging"
                      fill={theme.palette.text.secondary}
                      transform={`rotate(${
                        xAxesNotNull[j]?.angle ?? 0
                      }, ${x}, ${y})`}
                    >
                      {xAxesNotNull[j]?.renderTick?.({ tick: xTick, x, y }) ??
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
          const y = yAxisSpec.accessor(d)
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
  label = "",
  ticks,
  scale,
  orientation,
  drawGrid,
}: {
  pad: PlotPad
  height: number
  width: number
  label?: string
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

function Caption({ children }: { children: ReactNode }) {
  return (
    <div style={{ margin: 10, maxWidth: "80%", alignSelf: "center" }}>
      {children}
    </div>
  )
}

function FigureContainer({ children }: { children: ReactNode }) {
  const theme = useTheme()
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderBottom: `1px solid ${theme.palette.divider}`,
        alignItems: "center",
      }}
    >
      {children}
    </div>
  )
}
