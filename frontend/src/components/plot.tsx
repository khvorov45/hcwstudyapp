import { BarChart, XAxis, YAxis, Tooltip, Bar, Label } from "recharts"
import { useTheme } from "@material-ui/core"
import { Participant } from "../lib/data"
import * as d3 from "d3-array"
import moment from "moment"

export default function Plots({
  participants,
  vaccinationCounts,
}: {
  participants: Participant[]
  vaccinationCounts: { pid: string; count: number }[]
}) {
  const now = moment()
  const participantsExtra = participants.map((p) => ({
    age: now.diff(p.dob, "year"),
    prevVac: vaccinationCounts.find((v) => v.pid === p.pid)?.count ?? 0,
    ...p,
  }))

  return (
    <div style={{ display: "flex" }}>
      <PlotColumn title="Overall" participantsExtra={participantsExtra} />
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
          }))}
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
