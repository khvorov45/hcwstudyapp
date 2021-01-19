import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Label,
  LineChart,
  Line,
} from "recharts"
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  useTheme,
} from "@material-ui/core"
import { Participant, Serology, Site, SiteV } from "../lib/data"
import * as d3 from "d3-array"
import React, { useEffect, useState } from "react"
import { Route, useRouteMatch, Switch, Redirect } from "react-router-dom"
import { SimpleNav } from "./nav"
import detectScrollbarWidth from "../lib/scrollbar-width"
import { useWindowSize } from "../lib/hooks"

export default function Plots({
  participantsExtra,
  serology,
}: {
  participantsExtra: (Participant & { age: number; prevVac: number })[]
  serology: Serology[]
}) {
  const serologyExtra = serology.map((s) => ({
    site: participantsExtra.find((p) => p.pid === s.pid)?.site,
    ...s,
  }))
  const routeMatch = useRouteMatch<{ subpage: string }>("/plots/:subpage")
  const subpage = routeMatch?.params.subpage
  const windowSize = useWindowSize()
  return (
    <div>
      <SimpleNav
        links={[
          { name: "Baseline", link: "/plots/baseline" },
          { name: "Serology", link: "/plots/serology" },
        ]}
        active={({ link }) => link === `/plots/${subpage}`}
      />
      <div
        style={{
          height: windowSize.height - 50 - 50 - detectScrollbarWidth(),
          overflow: "scroll",
        }}
      >
        <Switch>
          <Route exact path="/plots">
            <Redirect to="/plots/baseline" />
          </Route>
          <Route exact path="/plots/baseline">
            <BaselinePlots participantsExtra={participantsExtra} />
          </Route>
          <Route exact path="/plots/serology">
            <SerologyPlots serology={serologyExtra} />
          </Route>
        </Switch>
      </div>
    </div>
  )
}

function SerologyPlots({
  serology,
}: {
  serology: (Serology & { site?: Site })[]
}) {
  const sites = Object.keys(SiteV.keys)
  const pids = Array.from(new Set(serology.map((s) => s.pid)))
  const viruses = Array.from(new Set(serology.map((s) => s.virus)))
  const days = Array.from(new Set(serology.map((s) => s.day))).sort(
    (a, b) => a - b
  )
  const titres = Array.from(new Set(serology.map((s) => s.titre))).sort(
    (a, b) => a - b
  )

  const [site, setSite] = useState(sites[0])
  const [virus, setVirus] = useState(viruses[0] ?? "")
  // Set the virus to the first value as soon as it's available
  useEffect(() => {
    virus === "" && viruses[0] && setVirus(viruses[0])
  }, [viruses, virus])

  const plotData = serology.filter(
    (s) => s.virus === virus && (site === "any" || s.site === site)
  )

  const serologyWide = days.map((day) =>
    plotData
      .filter((s) => s.day === day)
      .reduce((acc, cur) => Object.assign(acc, { [cur.pid]: cur.titre }), {
        day,
      })
  )
  const theme = useTheme()
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: 150, display: "flex", flexDirection: "column" }}>
        <FormControl>
          <InputLabel id="site-select-label">Site</InputLabel>
          <Select
            labelId="site-select-label"
            value={site}
            id="site-select"
            onChange={(e) => setSite(e.target.value as string)}
          >
            <MenuItem value="any">Any</MenuItem>
            {sites.map((s) => (
              <MenuItem key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel id="virus-select-label">Virus</InputLabel>
          <Select
            labelId="virus-select-label"
            value={virus}
            id="virus-select"
            onChange={(e) => setVirus(e.target.value as string)}
          >
            {viruses.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div>
        <LineChart
          width={450}
          height={250}
          data={serologyWide}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          {pids.map((pid) => (
            <Line
              key={pid}
              dataKey={pid}
              stroke="#8884d8"
              dot={true}
              isAnimationActive={false}
              connectNulls
            />
          ))}
          <YAxis
            ticks={titres}
            scale="log"
            domain={["auto", "auto"]}
            label="Titre"
          >
            <Label
              value="Titre"
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
            />
          </YAxis>
          <XAxis dataKey="day">
            <Label
              value="Day"
              position="bottom"
              style={{ textAnchor: "middle", fill: theme.palette.text.primary }}
            />
          </XAxis>
        </LineChart>
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
  return (
    <div style={{ display: "flex" }}>
      <PlotColumn title="Overall" participantsExtra={participantsExtra} />
      {sites.map((s) => (
        <PlotColumn
          key={s}
          title={s[0].toUpperCase() + s.slice(1)}
          participantsExtra={participantsExtra.filter((p) => p.site === s)}
        />
      ))}
    </div>
  )
}

function PlotColumn({
  title,
  participantsExtra,
}: {
  title: string
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
    <div>
      <div
        style={{
          fontSize: "large",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        {title}
      </div>
      <div>
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
  if (data.length === 0 || !data.some((r) => r[yKey] > 0)) return <></>
  return (
    <BarChart
      width={450}
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
      <Bar dataKey={yKey as string} fill="#8884d8" isAnimationActive={false} />
    </BarChart>
  )
}
