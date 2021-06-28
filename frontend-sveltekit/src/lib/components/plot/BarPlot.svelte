<script lang="ts">
  import Axis from "$lib/components/plot/Axis.svelte"
  import Bar from "$lib/components/plot/Bar.svelte"
  import type { PlotPad } from "$lib/util"
  import { defaultPlotPad, scaleLinear } from "$lib/util"

  export let plotWidth = 300
  export let plotHeight = 300

  export let dataX = [0]
  export let dataY = [1]

  export let yTicks = [0, 1]

  export let yLims: [number, number] = [0, 1]

  export let pad: PlotPad = defaultPlotPad()

  $: yScale = (x, i) =>
    scaleLinear(x, yLims, [
      plotHeight - pad.axis.bottom - pad.data.bottom,
      pad.axis.top + pad.data.top,
    ])

  export let yLab = "Count"
  export let xLab = "xLab"
</script>

<svg width={plotWidth} height={plotHeight}>
  <Axis {plotWidth} {plotHeight} ticks={dataX} label={xLab} {pad} />
  <Axis
    {plotWidth}
    {plotHeight}
    ticks={yTicks}
    label={yLab}
    orientation="v"
    scale={yScale}
    {pad}
  />
  <Bar {plotWidth} {plotHeight} data={dataY} {yLims} {pad} scaleYtop={yScale} />
</svg>
