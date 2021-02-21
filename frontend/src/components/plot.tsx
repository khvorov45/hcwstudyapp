import { Popover, useTheme } from "@material-ui/core"
import React, { ReactNode, SyntheticEvent, useState } from "react"
import { Route, useRouteMatch, Switch, Redirect } from "react-router-dom"
import { SimpleNav } from "./nav"
import ScreenHeight from "./screen-height"
import { useWindowSize } from "../lib/hooks"
import detectScrollbarWidth from "../lib/scrollbar-width"
import {
  ParticipantExtra,
  SerologyExtra,
  TitreChange,
  VaccinationCount,
} from "../lib/table-data"
import { Site, Virus } from "../lib/data"
import {
  ControlRibbon,
  Selector,
  SelectorMultiple,
  SiteSelect,
  StudyYearSelector,
  StudyYearSelectorMultiple,
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
  applyMultiFilter,
  applySingleFilter,
} from "../lib/util"
import { STUDY_YEARS } from "../lib/config"

export default function Plots({
  participantsExtra,
  serology,
  titreChange,
  virusTable,
  vaccinationCounts,
}: {
  participantsExtra: ParticipantExtra[]
  serology: SerologyExtra[]
  titreChange: TitreChange[]
  virusTable: Virus[]
  vaccinationCounts: VaccinationCount[]
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
          <BaselinePlots
            participantsExtra={participantsExtra}
            vaccinationCounts={vaccinationCounts}
          />
        </Route>
        <Route exact path="/plots/serology">
          <SerologyPlots
            serology={serology}
            titreChange={titreChange}
            virusTable={virusTable}
            vaccinationCounts={vaccinationCounts}
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
  vaccinationCounts,
}: {
  serology: SerologyExtra[]
  titreChange: TitreChange[]
  virusTable: Virus[]
  vaccinationCounts: VaccinationCount[]
}) {
  const uniqueSites = unique(serology.map((s) => s.site)).sort(stringSort)
  const uniqueDays = unique(serology.map((s) => s.day)).sort(numberSort)
  const uniqueVax = unique(vaccinationCounts.map((s) => s.years.length)).sort(
    numberSort
  )
  const uniqueViruses = virusTable.map((v) => v.name)

  // Coloring based on unique for consistency
  const colorsDays = createDescreteMapping(uniqueDays)

  // Filters applied in the order presented
  const [selectedStudyYear, setSelectedStudyYear] = useState(STUDY_YEARS[0])
  const [selectedRecruitmentYears, setSelectedRecruitmentYears] = useState<
    number[]
  >([])
  const [selectedSites, setSelectedSites] = useState<Site[]>([])
  const [vaxInStudyYear, setVaxInStudyYear] = useState<string | null>(null)
  const [selectedVax, setSelectedVax] = useState<number[]>([0, 5])

  // Site and vax determine the selection of pid and set it to null
  // Pid always sets site and vax to 1 value each
  const [selectedPid, setSelectedPid] = useState<string | null>(null)

  const [selectedViruses, setSelectedViruses] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 14])

  // Plot-specific
  const [gmtSettingsAnchor, setGMTSettingsAnchor] = useState<SVGElement | null>(
    null
  )

  // Apply filters
  const vaccinationCountsFilterYearSiteVax = vaccinationCounts.filter(
    (v) =>
      (vaxInStudyYear === null ||
        (vaxInStudyYear === "yes"
          ? v.years.includes(selectedStudyYear)
          : !v.years.includes(selectedStudyYear))) &&
      applyMultiFilter(
        selectedRecruitmentYears,
        v.dateScreening.getFullYear()
      ) &&
      applyMultiFilter(selectedSites, v.site) &&
      applyMultiFilter(
        selectedVax,
        v.years.filter((y) => y < selectedStudyYear).length
      )
  )
  const availablePids = vaccinationCountsFilterYearSiteVax
    .map((v) => v.pid)
    .sort(stringSort)
  const vaccinationCountsFiltered = vaccinationCountsFilterYearSiteVax
    .filter((v) => applySingleFilter(selectedPid, v.pid))
    .map((x) =>
      Object.assign(x, {
        prevVac: x.years.filter((y) => y < selectedStudyYear).length,
      })
    )
  function findPrevVac<T extends { pid: string }>(data: T): number {
    return (
      vaccinationCountsFiltered.find((v) => v.pid === data.pid)?.prevVac ?? -1
    )
  }

  const serologyFiltered = serology
    .filter(
      (s) =>
        s.redcapProjectYear === selectedStudyYear &&
        (selectedPid === null
          ? availablePids.includes(s.pid)
          : s.pid === selectedPid) &&
        applyMultiFilter(selectedViruses, s.virus) &&
        applyMultiFilter(selectedDays, s.day)
    )
    .map((x) =>
      Object.assign(x, {
        prevVac: findPrevVac(x),
      })
    )

  const titreChangeFiltered = titreChange
    .filter(
      (t) =>
        t.year === selectedStudyYear &&
        (selectedPid === null
          ? // This also takes care of site and vaccinations
            availablePids.includes(t.pid)
          : t.pid === selectedPid) &&
        applyMultiFilter(selectedViruses, t.virus)
    )
    .map((x) =>
      Object.assign(x, {
        prevVac: findPrevVac(x),
      })
    )

  // Summarise the filtered data

  // Serology (GMT's for virus/day/vax)
  const serologySummary = rollup(
    serologyFiltered,
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

  // Seroconversion and titre rises (for virus/vax)
  const seroconversionSummary = rollup(
    titreChangeFiltered,
    (x) => ({
      prevVac: x.prevVac,
      virusShortName: x.virusShortName,
    }),
    (arr) => ({
      seroconverted: summariseProportion(arr.map((a) => a.seroconverted)),
      titreChanges: summariseLogmean(arr.map((v) => v.rise)),
    })
  )
    .sort((a, b) => numberSort(a.prevVac, b.prevVac))
    .sort((a, b) => stringSort(a.virusShortName, b.virusShortName))

  const pad = (axes: ("virus" | "day" | "vax")[]) => ({
    axis: {
      top: 12,
      bottom:
        10 +
        (axes.includes("virus") && selectedViruses.length === 1 ? 0 : 110) +
        (axes.includes("day") && selectedDays.length === 1 ? 0 : 12) +
        (axes.includes("vax") && selectedVax.length === 1 ? 0 : 12),
      left: 55,
      right: 80,
    },
    data: { top: 0, right: 0, bottom: 10, left: 10 },
    yTitle: 20,
    xTitle: 20,
  })
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
        <StudyYearSelector
          value={selectedStudyYear}
          onChange={(y) => {
            setSelectedStudyYear(y ?? STUDY_YEARS[0])
            setSelectedPid(null)
          }}
          disableClearable
        />
        <StudyYearSelectorMultiple
          label="Recruited in"
          value={selectedRecruitmentYears}
          onChange={(y) => {
            setSelectedRecruitmentYears(y)
            setSelectedPid(null)
          }}
        />
        <SiteSelect
          sites={uniqueSites}
          site={selectedSites}
          setSite={(s) => {
            setSelectedSites(s)
            setSelectedPid(null)
          }}
        />
        <Selector
          options={["yes", "no"]}
          label={`Vax in ${selectedStudyYear}`}
          value={vaxInStudyYear}
          width={190}
          onChange={setVaxInStudyYear}
          inputMode="none"
        />
        <SelectorMultiple
          options={uniqueVax}
          label={`Vax prior to ${selectedStudyYear}`}
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
            const thisPid = serology.find((d) => d.pid === n)
            const thisCount = thisPid ? findPrevVac(thisPid) : undefined
            if (thisPid?.site !== undefined) {
              setSelectedSites([thisPid.site])
            }
            if (thisCount !== undefined) {
              setSelectedVax([thisCount])
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
      </ControlRibbon>
      <PlotContainer>
        <FigureContainer>
          <PointRange
            data={serologySummary}
            minWidthPerX={20}
            maxWidthMultiplier={3}
            height={400}
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
            pad={pad(["virus", "day", "vax"])}
            categorySeparatorXLevel={0}
            setSettingsAnchor={setGMTSettingsAnchor}
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
            data={seroconversionSummary}
            minWidthPerX={20}
            maxWidthMultiplier={3}
            height={400}
            yAxisSpec={{
              min: Math.min(
                0.5,
                getMin(seroconversionSummary.map((d) => d.titreChanges.low))
              ),
              max: Math.max(
                30,
                getMax(seroconversionSummary.map((d) => d.titreChanges.high))
              ),
              ticks: [0.5, 1, 2, 5, 10, 20, 30],
              lab: selectedPid
                ? "Fold-rise (14 vs 0)"
                : "GMR (14 vs 0, 95% CI)",
              type: "log",
              accessor: (d) => ({
                point: d.titreChanges.mean,
                low: d.titreChanges.low,
                high: d.titreChanges.high,
              }),
            }}
            xAxesSpec={[virusAxisSpec(), vaxAxisSpec()]}
            pad={pad(["virus", "vax"])}
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
              accessor: (d) => ({
                point: d.seroconverted.prop,
                low: d.seroconverted.low,
                high: d.seroconverted.high,
              }),
            }}
            xAxesSpec={[virusAxisSpec(), vaxAxisSpec()]}
            pad={pad(["virus", "vax"])}
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
      <Popover
        open={gmtSettingsAnchor !== null}
        onClose={() => setGMTSettingsAnchor(null)}
        anchorEl={gmtSettingsAnchor}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <SelectorMultiple
          options={uniqueDays}
          label="Day"
          width={200}
          value={selectedDays}
          onChange={setSelectedDays}
          inputMode="none"
        />
      </Popover>
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
  vaccinationCounts,
}: {
  participantsExtra: ParticipantExtra[]
  vaccinationCounts: VaccinationCount[]
}) {
  const uniqueSites = unique(participantsExtra.map((p) => p.site))
  const [selectedSerologyYear, setSelectedSerologyYear] = useState(
    STUDY_YEARS[0]
  )
  const [selectedRecruitmentYears, setSelectedRecruitmentYears] = useState<
    number[]
  >([])
  const [selectedSites, setSelectedSites] = useState<Site[]>([])

  const [
    priorVacSettingsAnchor,
    setPriorVacSettingsAnchor,
  ] = useState<SVGElement | null>(null)

  const vaccinationCountsFiltered = vaccinationCounts
    .filter(
      (v) =>
        applyMultiFilter(
          selectedRecruitmentYears,
          participantsExtra
            .find((p) => p.pid === v.pid)
            ?.dateScreening?.getFullYear() ?? null
        ) && applyMultiFilter(selectedSites, v.site)
    )
    .map((x) =>
      Object.assign(x, {
        prevVac: x.years.filter((y) => y < selectedSerologyYear).length,
      })
    )

  const participantsExtraFiltered = participantsExtra
    .filter(
      (p) =>
        applyMultiFilter(selectedSites, p.site) &&
        applyMultiFilter(
          selectedRecruitmentYears,
          p.dateScreening?.getFullYear() ?? null
        )
    )
    .map((p) =>
      Object.assign(p, {
        // If vaccinations aren't found then we know of 0 prior vaccinations I
        // guess but -1 because it shouldn't happen I don't think
        prevVac:
          vaccinationCountsFiltered.find((v) => v.pid === p.pid)?.prevVac ?? -1,
      })
    )

  type ColorVariable =
    | "gender"
    | "prevVac"
    | "ageCat"
    | "heightCat"
    | "weightCat"
    | "bmiCat"
    | "occupation"
  const [colorVariable, setColorVariable] = useState<ColorVariable | null>(null)

  const ageThresholds = [18, 30, 40, 50, 61]
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
      getter: (p: ParticipantExtra & { prevVac: number }) =>
        p.prevVac.toString(),
      sorter: stringSort,
    },
    ageCat: {
      lab: "Age",
      getter: (p: ParticipantExtra) =>
        cut(p.ageRecruitment, { thresholds: ageThresholds }).string,
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
    occupation: {
      lab: "Occupation",
      getter: (p: ParticipantExtra) => p.occupation ?? "(missing)",
      sorter: stringSort,
    },
  }
  return (
    <>
      <ControlRibbon>
        <StudyYearSelectorMultiple
          label="Recruited in"
          value={selectedRecruitmentYears}
          onChange={setSelectedRecruitmentYears}
        />
        <SiteSelect
          sites={uniqueSites}
          site={selectedSites}
          setSite={setSelectedSites}
        />
        <Selector
          options={[
            "ageCat",
            "heightCat",
            "weightCat",
            "bmiCat",
            "gender",
            "prevVac",
            "occupation",
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
          participantsExtra={participantsExtraFiltered}
          getColorVariable={
            colorVariable
              ? (p) => options[colorVariable].getter(p)
              : () => "constant"
          }
          sortColorVariable={
            colorVariable ? options[colorVariable].sorter : stringSort
          }
          ageThresholds={ageThresholds}
          heightThresholds={heightThresholds}
          weightThresholds={weightThresholds}
          bmiThresholds={bmiThresholds}
          setPriorVacSettingsAnchor={setPriorVacSettingsAnchor}
        />
      </PlotContainer>
      <Popover
        open={priorVacSettingsAnchor !== null}
        onClose={() => setPriorVacSettingsAnchor(null)}
        anchorEl={priorVacSettingsAnchor}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <StudyYearSelector
          value={selectedSerologyYear}
          onChange={(x) => setSelectedSerologyYear(x ?? STUDY_YEARS[0])}
          disableClearable
        />
      </Popover>
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
  setPriorVacSettingsAnchor,
}: {
  participantsExtra: (ParticipantExtra & { prevVac: number })[]
  getColorVariable: (p: ParticipantExtra & { prevVac: number }) => string
  sortColorVariable: (a: string, b: string) => number
  ageThresholds: number[]
  heightThresholds: number[]
  weightThresholds: number[]
  bmiThresholds: number[]
  setPriorVacSettingsAnchor: (el: SVGElement) => void
}) {
  const colorVarValues = unique(participantsExtra.map(getColorVariable))
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

  const occupationCounts = rollup(
    participantsExtra,
    (x) => ({ occupation: x.occupation, colorVar: getColorVariable(x) }),
    (v) => ({ count: v.length })
  )
    .sort((a, b) => sortColorVariable(a.colorVar, b.colorVar))
    .sort((a, b) => stringSort(a.occupation, b.occupation))

  const agesBinned = rollup(
    participantsExtra,
    (p) => ({
      colorVar: getColorVariable(p),
      ageCat: cut(p.ageRecruitment, { thresholds: ageThresholds }).string,
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
        setSettingsAnchor={setPriorVacSettingsAnchor}
      />
      <GenericBar
        data={agesBinned}
        yAxisSpec={{
          lab: "Count",
          accessor: (d) => d.count,
        }}
        xAxisSpec={{
          lab: "Age at recruitment",
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
        data={occupationCounts}
        yAxisSpec={{
          lab: "Count",
          accessor: (d) => d.count,
        }}
        xAxisSpec={{
          lab: "Occupation",
          accessor: (d) => d.occupation ?? "(missing)",
          angle: 45,
        }}
        getColor={getColor}
        modPad={(p) => {
          p.axis.bottom = 85
          p.axis.right = 20
          return p
        }}
        relativeBarWidth={1}
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
  relativeBarWidth,
  height = 200,
  modPad = (p) => p,
  yAxisSpec,
  xAxisSpec,
  getColor,
  setSettingsAnchor,
  positionSettings = ({ height, pad }) => ({
    y: height - pad.axis.bottom,
    x: 0,
  }),
}: {
  data: T[]
  fixedWidth?: number
  fixedBarWidth?: number
  relativeBarWidth?: number
  height?: number
  modPad?: (p: PlotPad) => PlotPad
  yAxisSpec: AxisSpec<T, number>
  xAxisSpec: AxisSpec<T, string>
  getColor?: (d: T) => string
  setSettingsAnchor?: (el: SVGElement) => void
  positionSettings?: (d: {
    pad: PlotPad
    width: number
    height: number
  }) => { x: number; y: number }
}) {
  const pad = modPad({
    axis: { top: 20, right: 0, bottom: 40, left: 50 },
    data: { top: 0, right: 30, bottom: 0, left: 30 },
    yTitle: 15,
    xTitle: 5,
  })
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
  const { width, pageWidth, widthPerX } = usePlotSize({
    uniqueXCount: xValuesUnique.length,
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
  const barWidth =
    relativeBarWidth === undefined
      ? fixedBarWidth
      : relativeBarWidth * widthPerX
  const settingsPosition = positionSettings({ pad, width, height })
  return (
    <SinglePlotContainer width={pageWidth} height={height}>
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
          angle={xAxisSpec.angle}
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
        {/* Control elements */}
        {setSettingsAnchor && (
          <SettingsIconEmbed
            x={settingsPosition.x}
            y={settingsPosition.y}
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
          />
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
    pageWidth: windowSize.width - detectScrollbarWidth(),
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
  setSettingsAnchor,
  positionSettings = ({ height, pad }) => ({
    y: height - pad.axis.bottom,
    x: 0,
  }),
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
  setSettingsAnchor?: (el: SVGElement) => void
  positionSettings?: (d: {
    pad: PlotPad
    width: number
    height: number
  }) => { x: number; y: number }
}) {
  const xAxesNotNull = xAxesSpec.filter(filterNotNull)
  const xAccessor = (d: T) =>
    xAxesNotNull.length === 0
      ? [""]
      : xAxesNotNull.map((xAxis) => xAxis.accessor(d))

  // Figure out plot dimensions (data-dependent)
  const uniqueXs = Array.from(new Set(data.map((x) => xAccessor(x))))
  const { width, widthPerX, pageWidth } = usePlotSize({
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
  const settingsIconPosition = positionSettings({ pad, width, height })
  return (
    <SinglePlotContainer width={pageWidth} height={height}>
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
        {/* Control elements */}
        {setSettingsAnchor && (
          <SettingsIconEmbed
            x={settingsIconPosition.x}
            y={settingsIconPosition.y}
            onClick={(e) => setSettingsAnchor(e.currentTarget)}
          />
        )}
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
  width,
}: {
  children: ReactNode
  height: number
  width: number
}) {
  return (
    <div
      style={{
        overflowX: "scroll",
        overflowY: "hidden",
        height: height + detectScrollbarWidth(),
        width: width,
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
  angle = 0,
}: {
  pad: PlotPad
  height: number
  width: number
  label?: string
  ticks: T[]
  scale: (x: T) => number
  orientation: "horizontal" | "vertical"
  drawGrid: boolean
  angle?: number
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
  let lastDrawnTickCoordinate = Infinity
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
        const distance = Math.abs(coordinate - lastDrawnTickCoordinate)
        const maxAllowed = isX ? width - pad.axis.right : pad.axis.top
        if (
          (isX ? coordinate > maxAllowed : coordinate < maxAllowed) ||
          distance < 10
        ) {
          return <g key={`${isX ? "x" : "y"}-tick-${i}`} />
        }
        lastDrawnTickCoordinate = coordinate
        const x = isX
          ? coordinate
          : pad.axis.left - theme.plot.tickLength - theme.plot.tickLabelFromTick
        const y = isX
          ? height -
            (pad.axis.bottom -
              theme.plot.tickLength -
              theme.plot.tickLabelFromTick)
          : coordinate
        return (
          <g key={`${isX ? "x" : "y"}-tick-${i}`}>
            {/* Number */}
            <text
              fill={theme.palette.text.secondary}
              x={x}
              y={y}
              textAnchor={isX ? (angle !== 0 ? "start" : "middle") : "end"}
              dominantBaseline={isX ? "hanging" : "middle"}
              transform={`rotate(${angle}, ${x}, ${y})`}
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
  return <div style={{ maxWidth: "80%", alignSelf: "center" }}>{children}</div>
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

function SettingsIconEmbed({
  x,
  y,
  onClick,
}: {
  x: number
  y: number
  onClick: (e: SyntheticEvent<SVGElement>) => void
}) {
  const theme = useTheme()
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <path
        d="M32.57 15.72l-3.35-1a11.65 11.65 0 0 0-.95-2.33l1.64-3.07a.61.61 0 0 0-.11-.72l-2.39-2.4a.61.61 0 0 0-.72-.11l-3.05 1.63a11.62 11.62 0 0 0-2.36-1l-1-3.31a.61.61 0 0 0-.59-.41h-3.38a.61.61 0 0 0-.58.43l-1 3.3a11.63 11.63 0 0 0-2.38 1l-3-1.62a.61.61 0 0 0-.72.11L6.2 8.59a.61.61 0 0 0-.11.72l1.62 3a11.63 11.63 0 0 0-1 2.37l-3.31 1a.61.61 0 0 0-.43.58v3.38a.61.61 0 0 0 .43.58l3.33 1a11.62 11.62 0 0 0 1 2.33l-1.64 3.14a.61.61 0 0 0 .11.72l2.39 2.39a.61.61 0 0 0 .72.11l3.09-1.65a11.65 11.65 0 0 0 2.3.94l1 3.37a.61.61 0 0 0 .58.43h3.38a.61.61 0 0 0 .58-.43l1-3.38a11.63 11.63 0 0 0 2.28-.94l3.11 1.66a.61.61 0 0 0 .72-.11l2.39-2.39a.61.61 0 0 0 .11-.72l-1.66-3.1a11.63 11.63 0 0 0 .95-2.29l3.37-1a.61.61 0 0 0 .43-.58v-3.41a.61.61 0 0 0-.37-.59zM18 23.5a5.5 5.5 0 1 1 5.5-5.5a5.5 5.5 0 0 1-5.5 5.5z"
        fill={theme.palette.text.secondary}
      />
      <rect x={0} y={0} width={36} height={36} fill="rgba(0, 0, 0, 0)" />
    </g>
  )
}
