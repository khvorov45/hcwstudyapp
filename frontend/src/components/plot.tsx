import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Label,
  LineChart,
  Line,
  Legend,
} from "recharts"
import {
  createStyles,
  makeStyles,
  TextField,
  Theme,
  useTheme,
} from "@material-ui/core"
import { Participant, Serology, Site } from "../lib/data"
import * as d3 from "d3-array"
import React, { useState } from "react"
import { Route, useRouteMatch, Switch, Redirect } from "react-router-dom"
import { SimpleNav } from "./nav"
import ScreenHeight from "./screen-height"
import Autocomplete from "@material-ui/lab/Autocomplete"
import { useWindowSize } from "../lib/hooks"
import { interpolateSinebow } from "d3-scale-chromatic"

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    control: {
      display: "flex",
      flexWrap: "wrap",
      "&>*": {
        marginRight: 10,
      },
    },
  })
)

export default function Plots({
  participantsExtra,
  serology,
}: {
  participantsExtra: (Participant & { age: number; prevVac: number })[]
  serology: (Serology & { site?: Site })[]
  titreChange: { pid: string; site: Site }[]
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
      <ScreenHeight heightTaken={50 + 50}>
        <Switch>
          <Route exact path="/plots">
            <Redirect to="/plots/baseline" />
          </Route>
          <Route exact path="/plots/baseline">
            <BaselinePlots participantsExtra={participantsExtra} />
          </Route>
          <Route exact path="/plots/serology">
            <SerologyPlots serology={serology} />
          </Route>
        </Switch>
      </ScreenHeight>
    </div>
  )
}

function SerologyPlots({
  serology,
}: {
  serology: (Serology & { site?: Site; prevVac?: number })[]
}) {
  const viruses = Array.from(
    new Set(serology.map((s) => s.virus))
  ).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
  const days = Array.from(new Set(serology.map((s) => s.day))).sort(
    (a, b) => a - b
  )
  const titres = Array.from(new Set(serology.map((s) => s.titre))).sort(
    (a, b) => a - b
  )
  const sites = Array.from(new Set(serology.map((s) => s.site ?? "(missing)")))
  const prevVacs = Array.from(
    new Set(serology.map((s) => s.prevVac ?? Infinity))
  )
    .sort((a, b) => a - b)
    .map((x) => (x === Infinity ? "(missing)" : x))

  // Filters applied in the order presented
  const [vaccinations, setVaccinations] = useState<number | "(missing)" | null>(
    null
  )
  const [site, setSite] = useState<string | null>(null)
  const [virus, setVirus] = useState<string | null>(null)
  const [selectedPid, setSelectedPid] = useState<string | null>(null)

  const vacFiltered = serology.filter(
    (s) => !vaccinations || s.prevVac === vaccinations
  )
  const siteFiltered = vacFiltered.filter((s) => !site || s.site === site)
  const virusFiltered = siteFiltered.filter((s) => !virus || s.virus === virus)
  const pidFiltered = virusFiltered.filter(
    (s) => !selectedPid || s.pid === selectedPid
  )

  const availablePids = Array.from(
    new Set(siteFiltered.map((s) => s.pid))
  ).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))

  // Summarise each virus
  const virusDaySummarized = d3.rollup(
    pidFiltered,
    (v) => Math.exp(d3.mean(v.map((d) => Math.log(d.titre))) ?? 0),
    (d) => d.virus,
    (d) => d.day
  )

  const serologyWide = days.map((day) =>
    viruses.reduce(
      (acc, v) =>
        Object.assign(acc, { [v]: virusDaySummarized.get(v)?.get(day) }),
      {
        day,
      }
    )
  )

  const classes = useStyles()
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className={classes.control}>
        <Autocomplete
          options={prevVacs}
          getOptionLabel={(option) => option.toString()}
          style={{ width: 125 }}
          renderInput={(params) => (
            <TextField {...params} label="Vaccinations" />
          )}
          value={vaccinations}
          onChange={(e, n) => {
            setVaccinations(n)
            setSelectedPid(null)
          }}
        />
        <SiteSelect
          sites={sites}
          site={site}
          setSite={(s) => {
            setSite(s)
            setSelectedPid(null)
          }}
        />
        <Autocomplete
          options={viruses}
          getOptionLabel={(option) => option}
          style={{ width: 225 }}
          renderInput={(params) => <TextField {...params} label="Virus" />}
          value={virus}
          onChange={(e, n) => setVirus(n)}
        />
        <Autocomplete
          options={availablePids}
          getOptionLabel={(option) => option}
          style={{ width: 150 }}
          renderInput={(params) => <TextField {...params} label="PID" />}
          value={selectedPid}
          onChange={(e, n) => {
            setSelectedPid(n)
            const thisPid = pidFiltered.find((d) => d.pid === n)
            if (!site) {
              setSite(thisPid?.site ?? null)
            }
            if (!vaccinations) {
              setVaccinations(thisPid?.prevVac ?? null)
            }
          }}
        />
      </div>
      <div>
        <Spaghetti
          data={serologyWide}
          keys={viruses}
          yTicks={titres}
          yLab={selectedPid ? "Titre" : "GMT"}
        />
      </div>
    </div>
  )
}

function BaselinePlots({
  participantsExtra,
}: {
  participantsExtra: (Participant & { age: number; prevVac: number })[]
}) {
  const sites = Array.from(new Set(participantsExtra.map((p) => p.site)))
  const [site, setSite] = useState<string | null>(null)
  return (
    <div>
      <SiteSelect sites={sites} site={site} setSite={setSite} />
      <PlotColumn
        participantsExtra={participantsExtra.filter(
          (p) => !site || p.site === site
        )}
      />
    </div>
  )
}

function PlotColumn({
  participantsExtra,
}: {
  participantsExtra: (Participant & { age: number; prevVac: number })[]
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
  site: string | null
  setSite: (s: string | null) => void
}) {
  return (
    <Autocomplete
      options={sites}
      getOptionLabel={(option) => option[0].toUpperCase() + option.slice(1)}
      style={{ width: 150 }}
      renderInput={(params) => <TextField {...params} label="Site" />}
      value={site}
      onChange={(e, n) => setSite(n)}
    />
  )
}

function Spaghetti<T extends Object>({
  data,
  yTicks,
  keys,
  yLab,
}: {
  data: T[]
  yTicks: number[]
  yLab: string
  keys: string[]
}) {
  const lineColors = keys.map((k, i) =>
    interpolateSinebow(i / (keys.length - 1) / 1.1)
  )
  const windowSize = useWindowSize()
  const theme = useTheme()
  return (
    <LineChart
      width={windowSize.width - 20 > 800 ? 800 : windowSize.width - 20}
      height={400}
      data={data}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
    >
      {keys.map((k, i) => (
        <Line
          key={k}
          dataKey={k}
          stroke={lineColors[i]}
          dot={{
            fill: lineColors[i],
            stroke: lineColors[i],
            shape: "square",
          }}
          isAnimationActive={false}
          connectNulls
        />
      ))}
      <YAxis
        ticks={yTicks}
        scale="log"
        domain={["auto", "auto"]}
        tick={{
          fill: theme.palette.text.secondary,
        }}
      >
        <Label
          value={yLab}
          angle={-90}
          position="insideLeft"
          style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
        />
      </YAxis>
      <XAxis
        dataKey="day"
        tick={{
          fill: theme.palette.text.secondary,
        }}
      >
        <Label
          value="Day"
          position="bottom"
          style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
        />
      </XAxis>
      <Legend verticalAlign="top" />
    </LineChart>
  )
}
