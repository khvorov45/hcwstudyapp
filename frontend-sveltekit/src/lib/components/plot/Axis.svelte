<script lang="ts">
  import type { PlotPad } from "$lib/util"
  import { defaultPlotPad, scaleLinear } from "$lib/util"
  import StraightLine from "$lib/components/plot/StraightLine.svelte"

  export let pad: PlotPad = defaultPlotPad()
  export let plotWidth = 0
  export let plotHeight = 0
  export let label = ""
  export let ticks: any[] = []

  export let orientation: "h" | "v" = "h"
  export let drawGrid = true
  export let angle = 0

  export let tickLength = 5
  export let tickLabelDistanceFromTick = 5
  export let minTickDistance = 10

  export let colorLine = "var(--color-font-2)"
  export let colorTitle = "var(--color-font-1)"
  export let colorText = "var(--color-font-2)"
  export let colorTicks = "var(--color-font-2)"
  export let colorGrid = "var(--color-bg-2)"

  let isX = orientation == "h"

  export let scale: (x: any, i: number) => number = (x, i) =>
    scaleLinear(
      i,
      [0, ticks.length - 1],
      isX
        ? [
            pad.axis.left + pad.data.left,
            plotWidth - pad.axis.right - pad.data.right,
          ]
        : [
            plotHeight - pad.axis.bottom - pad.data.bottom,
            pad.axis.top + pad.data.top,
          ]
    )

  const axisTitleCoords = [
    isX
      ? (plotWidth - pad.axis.left - pad.axis.right) / 2 + pad.axis.left
      : pad.yTitle,
    isX
      ? plotHeight - pad.xTitle
      : (plotHeight - pad.axis.top - pad.axis.bottom) / 2 + pad.axis.top,
  ]

  $: tickCoordinates = ticks.map((tick, i) => {
    const coordinate = scale(tick, i)
    if (isX) {
      return {
        x: coordinate,
        y:
          plotHeight -
          (pad.axis.bottom - tickLength - tickLabelDistanceFromTick),
      }
    }
    return {
      x: pad.axis.left - tickLength - tickLabelDistanceFromTick,
      y: coordinate,
    }
  })

  // Make sure the minTickDistance is respected
  $: if (tickCoordinates.length > 0) {
    let tickCoordinatesDistanceFiltered = [tickCoordinates[0]]
    let lastAcceptedTickCoord = isX
      ? tickCoordinates[0].x
      : tickCoordinates[0].y
    for (let coords of tickCoordinates.slice(1)) {
      let coord = isX ? coords.x : coords.y
      if (Math.abs(coord - lastAcceptedTickCoord) > minTickDistance) {
        lastAcceptedTickCoord = coord
        tickCoordinatesDistanceFiltered.push(coords)
      }
    }
    tickCoordinates = tickCoordinatesDistanceFiltered
  }
</script>

<!-- Line -->
<StraightLine
  x={isX ? undefined : pad.axis.left}
  x1={isX ? pad.axis.left : undefined}
  x2={isX ? plotWidth - pad.axis.right : undefined}
  y={isX ? plotHeight - pad.axis.bottom : undefined}
  y1={isX ? undefined : plotHeight - pad.axis.bottom}
  y2={isX ? undefined : pad.axis.top}
  color={colorLine}
/>

<!-- Name -->
<text
  x={axisTitleCoords[0]}
  y={axisTitleCoords[1]}
  fill={colorTitle}
  text-anchor="middle"
  transform={isX
    ? ""
    : `rotate(-90, ${axisTitleCoords[0]}, ${axisTitleCoords[1]})`}
>
  {label}
</text>

<!-- Ticks -->
{#each tickCoordinates as tickCoordinate, i}
  <g>
    <!-- Number -->
    <text
      fill={colorText}
      x={tickCoordinate.x}
      y={tickCoordinate.y}
      text-anchor={isX ? (angle !== 0 ? "start" : "middle") : "end"}
      dominant-baseline={isX ? "hanging" : "middle"}
      transform={`rotate(${angle}, ${tickCoordinate.x}, ${tickCoordinate.y})`}
    >
      {ticks[i]}
    </text>
    <!-- Tick -->
    <StraightLine
      x1={isX ? undefined : pad.axis.left - tickLength}
      x2={isX ? undefined : pad.axis.left}
      y={isX ? undefined : tickCoordinate.y}
      x={isX ? tickCoordinate.x : undefined}
      y1={isX ? plotHeight - pad.axis.bottom : undefined}
      y2={isX ? plotHeight - pad.axis.bottom + tickLength : undefined}
      color={colorTicks}
    />
    <!-- Grid line -->
    {#if drawGrid}
      <StraightLine
        x1={isX ? undefined : pad.axis.left}
        x2={isX ? undefined : plotWidth - pad.axis.right}
        y={isX ? undefined : tickCoordinate.y}
        x={isX ? tickCoordinate.x : undefined}
        y1={isX ? plotHeight - pad.axis.bottom : undefined}
        y2={isX ? pad.axis.top : undefined}
        color={colorGrid}
      />
    {/if}
  </g>
  ) )
{/each}
