import { ReactNode } from 'react'
import { bin } from 'd3-array'
import {
  BarChart, XAxis, YAxis, Tooltip, Bar, Label
} from 'recharts'
import styles from './plot.module.css'

export default function Plotlist ({ children }: {children: ReactNode}) {
  return <div className={styles.plotlist}>
    {children}
  </div>
}

export function GenericBar (
  { data, xlab }:
  {data: any, xlab: string}
) {
  return <BarChart
    width={450} height={250} data={data}
    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
  >
    <XAxis
      dataKey="x" tick={{
        fill: 'var(--font-color-muted)'
      }}
    >
      <Label
        value={xlab}
        position='bottom'
        style={{ textAnchor: 'middle', fill: 'var(--font-color)' }}
      />
    </XAxis>
    <YAxis
      tick={{ fill: 'var(--font-color-muted)' }}
    >
      <Label
        angle={-90} value='Count'
        position='insideLeft'
        style={{ textAnchor: 'middle', fill: 'var(--font-color)' }}
      />
    </YAxis>
    <Tooltip
      contentStyle={{
        'background-color': 'var(--bg-color)',
        border: '1px solid var(--border)'
      }}
      cursor={{ fill: 'var(--bg-color-alt)' }}
      itemStyle={{
        color: 'var(--font-color)'
      }}
    />
    <Bar
      dataKey="y" fill="#8884d8" isAnimationActive={false}
    />
  </BarChart>
}

export function CategoricalBar (
  { data, accessor, xlab }:
  {data: any, accessor: (row) => string, xlab: string}
) {
  const processedData = {}
  data.map(row => {
    const val = accessor(row)
    Object.keys(processedData).includes(val)
      ? ++processedData[val]
      : processedData[val] = 1
  })
  const barData = []
  for (const val in processedData) {
    barData.push({
      x: val,
      y: processedData[val]
    })
  }
  return <GenericBar data={barData} xlab={xlab} />
}

export function GenderBar ({ data }: {data: any}) {
  return <CategoricalBar
    data={data}
    accessor={row => row.gender === '' ? '(Missing)' : row.gender}
    xlab='Gender'
  />
}

export function AgeHistogram ({ data }: {data: any}) {
  const histData = bin()
    .value(row => row.age)
    .thresholds([18, 30, 40, 50, 66])(data)
    .reduce(
      (acc, el) => {
        acc.push({
          x: el.x0 < 18 ? `<${el.x1}`
            : el.x1 > 66 ? `>=${el.x0}`
              : `${el.x0}-${el.x1 - 1}`,
          y: el.length
        })
        return acc
      },
      []
    )
  return <GenericBar data={histData} xlab='Age' />
}

export function PrevVacBar ({ data }: {data: any}) {
  return <CategoricalBar
    data={data}
    accessor={row => row.numSeasVac.toString()}
    xlab='Previous Vaccinations'
  />
}
