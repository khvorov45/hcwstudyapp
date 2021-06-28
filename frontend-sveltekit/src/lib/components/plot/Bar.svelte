<script lang="ts">
  import type { PlotPad } from "$lib/util"
  import { defaultPlotPad, scaleLinear, max } from "$lib/util"

  export let pad: PlotPad = defaultPlotPad()
  export let plotHeight = 100
  export let plotWidth = 100
  export let width = 30
  export let yBottom = plotHeight - pad.axis.bottom

  export let data: number[] = [10]
  export let yLims: [number, number] = [0, 10]

  export let scaleYtop: (x: number, i: number) => number = (x, i) =>
    scaleLinear(x, yLims, [
      plotHeight - pad.axis.bottom - pad.data.bottom,
      pad.axis.top + pad.data.top,
    ])

  export let scaleXCenter: (x: any, i: number) => number = (x, i) =>
    scaleLinear(
      i,
      [0, data.length - 1],
      [
        pad.axis.left + pad.data.left,
        plotWidth - pad.axis.right - pad.data.right,
      ]
    )

  export let color = "var(--color-primary-3)"
  export let textColor = "var(--color-font-1)"
  export let textBackground = "var(--color-bg-1)"

  $: yTops = data.map(scaleYtop)
  $: heights = yTops.map((x) => yBottom - x)
  $: xCenters = data.map(scaleXCenter)
  $: xLefts = xCenters.map((x) => x - width / 2)
</script>

{#each xLefts as xLeft, i}
  <rect x={xLeft} y={yTops[i]} {width} height={heights[i]} fill={color} />
  <text
    x={xCenters[i]}
    y={yBottom}
    paint-order="stroke"
    stroke={textBackground}
    stroke-width="2px"
    stroke-linecap="butt"
    stroke-linejoin="miter"
    font-weight={500}
    font-size={18}
    fill={textColor}
    dominant-baseline="middle"
    transform={`rotate(-90, ${xCenters[i]}, ${yBottom})`}
    opacity={0.8}
  >
    {data[i]}
  </text>
{/each}
