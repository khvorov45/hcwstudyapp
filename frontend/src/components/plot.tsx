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
  createStyles,
  FormControl,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  TextField,
  Theme,
  useTheme,
} from "@material-ui/core"
import { Participant, Serology, Site, SiteV } from "../lib/data"
import * as d3 from "d3-array"
import React, { useEffect, useState } from "react"
import { Route, useRouteMatch, Switch, Redirect } from "react-router-dom"
import { SimpleNav } from "./nav"
import ScreenHeight from "./screen-height"
import Autocomplete from "@material-ui/lab/Autocomplete"
import { useWindowSize } from "../lib/hooks"

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
  serology: Serology[]
}) {
  const serologyExtra = serology.map((s) => ({
    site: participantsExtra.find((p) => p.pid === s.pid)?.site,
    ...s,
  }))
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
            <SerologyPlots serology={serologyExtra} />
          </Route>
        </Switch>
      </ScreenHeight>
    </div>
  )
}

function SerologyPlots({
  serology,
}: {
  serology: (Serology & { site?: Site })[]
}) {
  const sites = Object.keys(SiteV.keys)

  const viruses = Array.from(
    new Set(serology.map((s) => s.virus))
  ).sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
  const days = Array.from(new Set(serology.map((s) => s.day))).sort(
    (a, b) => a - b
  )
  const titres = Array.from(new Set(serology.map((s) => s.titre))).sort(
    (a, b) => a - b
  )

  const [site, setSite] = useState(sites[0])
  const [virus, setVirus] = useState<string | null>(null)
  const [selectedPid, setSelectedPid] = useState<string | null>(null)
  // Set the virus to the first value as soon as it's available
  useEffect(() => {
    !virus && viruses[0] && setVirus(viruses[0])
  }, [viruses, virus])

  const filteredData = serology.filter(
    (s) => s.virus === virus && (site === "any" || s.site === site)
  )

  const availablePids = Array.from(new Set(filteredData.map((s) => s.pid)))

  const plotData = filteredData.filter(
    (s) => !selectedPid || s.pid === selectedPid
  )

  const plotPids = Array.from(new Set(plotData.map((s) => s.pid)))

  const serologyWide = days.map((day) =>
    plotData
      .filter((s) => s.day === day)
      .reduce((acc, cur) => Object.assign(acc, { [cur.pid]: cur.titre }), {
        day,
      })
  )
  const theme = useTheme()
  const classes = useStyles()
  const windowSize = useWindowSize()
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className={classes.control}>
        <FormControl>
          <InputLabel id="site-select-label">Site</InputLabel>
          <Select
            labelId="site-select-label"
            value={site}
            id="site-select"
            onChange={(e) => setSite(e.target.value as string)}
            style={{ width: 125 }}
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
            value={virus ?? ""}
            id="virus-select"
            onChange={(e) => setVirus(e.target.value as string)}
            style={{ width: 225 }}
          >
            {viruses.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Autocomplete
          id="combo-box-demo"
          options={availablePids}
          getOptionLabel={(option) => option}
          style={{ width: 150 }}
          renderInput={(params) => <TextField {...params} label="PID" />}
          value={selectedPid}
          onChange={(e, n) => setSelectedPid(n)}
        />
      </div>
      <div>
        <LineChart
          width={windowSize.width - 20 > 800 ? 800 : windowSize.width - 20}
          height={400}
          data={serologyWide}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          {plotPids.map((pid) => (
            <Line
              key={pid}
              dataKey={pid}
              stroke={
                theme.palette.primary[
                  theme.palette.type === "dark" ? "light" : "dark"
                ]
              }
              dot={{
                fill: theme.palette.text.secondary,
                stroke: theme.palette.text.secondary,
              }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
          <YAxis
            ticks={titres}
            scale="log"
            domain={["auto", "auto"]}
            tick={{
              fill: theme.palette.text.secondary,
            }}
          >
            <Label
              value="Titre"
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
  const [site, setSite] = useState<string | null>("overall")
  return (
    <div>
      <Autocomplete
        id="site-select"
        options={(sites as string[]).concat(["overall"])}
        getOptionLabel={(option) => option[0].toUpperCase() + option.slice(1)}
        style={{ width: 150 }}
        renderInput={(params) => <TextField {...params} label="Site" />}
        value={site}
        onChange={(e, n) => setSite(n)}
      />
      <PlotColumn
        participantsExtra={participantsExtra.filter(
          (p) => site === "overall" || p.site === site
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
