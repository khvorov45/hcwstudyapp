<script lang="ts">
  import type { PlotPad } from "$lib/util"
  import StraightLine from "$lib/components/plot/StraightLine.svelte"

  export let pad: PlotPad = {
    axis: { top: 0, bottom: 0, left: 0, right: 0 },
    data: { top: 0, bottom: 0, left: 0, right: 0 },
    yTitle: 0,
    xTitle: 0,
  }
  export let plotWidth = 0
  export let plotHeight = 0
  export let label = ""
  export let ticks: any[] = []
  export let scale: (x: any) => number
  export let orientation: "h" | "v" = "h"
  export let drawGrid = true
  export let angle = 0

  export let tickLength = 5
  export let tickLabelDistanceFromTick = 5
  export let maxTickDistance = 10
  export let color = "gray"

  let isX = orientation == "h"

  const axisTitleCoords = [
    isX
      ? (plotWidth - pad.axis.left - pad.axis.right) / 2 + pad.axis.left
      : pad.yTitle,
    isX
      ? plotHeight - pad.xTitle
      : (plotHeight - pad.axis.top - pad.axis.bottom) / 2 + pad.axis.top,
  ]

  let tickCoordinates = ticks.map((tick) => {
    const coordinate = scale(tick)
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

  let tickDistances = tickCoordinates.reduce((distances, coords) => {
    let coordinate = isX ? coords.x : coords.y
    if (distances.length === 0) {
      distances.push(coordinate)
    } else {
      distances.push(coordinate - distances[distances.length - 1])
    }
    return distances
  }, [])

  tickCoordinates = tickCoordinates.filter((coords, index) => {
    let coordinate = isX ? coords.x : coords.y
    const maxAllowedCoordinate = isX ? plotWidth - pad.axis.right : pad.axis.top
    return (
      tickDistances[index] < maxTickDistance &&
      coordinate < maxAllowedCoordinate
    )
  })
</script>

<!-- Line -->
<StraightLine
  x={isX ? undefined : pad.axis.left}
  x1={isX ? pad.axis.left : undefined}
  x2={isX ? plotWidth - pad.axis.right : undefined}
  y={isX ? plotHeight - pad.axis.bottom : undefined}
  y1={isX ? undefined : plotHeight - pad.axis.bottom}
  y2={isX ? undefined : pad.axis.top}
  {color}
/>

<!-- Name -->
<text
  x={axisTitleCoords[0]}
  y={axisTitleCoords[1]}
  fill="var(--color-font-1)"
  text-anchor="middle"
  transform={isX
    ? ""
    : `rotate(-90, ${axisTitleCoords[0]}, ${axisTitleCoords[1]})`}
>
  {label}
</text>

<!-- Ticks -->
{#each tickCoordinates as tickCoordinate}
  <g>
    <!-- Number -->
    <text
      fill="var(--color-font-2)"
      x={tickCoordinate.x}
      y={tickCoordinate.y}
      text-anchor={isX ? (angle !== 0 ? "start" : "middle") : "end"}
      dominant-baseline={isX ? "hanging" : "middle"}
      transform={`rotate(${angle}, ${tickCoordinate.x}, ${tickCoordinate.y})`}
    >
      {0}
    </text>
    <!-- Tick -->
    <StraightLine
      x1={isX ? undefined : pad.axis.left - tickLength}
      x2={isX ? undefined : pad.axis.left}
      y={isX ? undefined : tickCoordinate.y}
      x={isX ? tickCoordinate.x : undefined}
      y1={isX ? plotHeight - pad.axis.bottom : undefined}
      y2={isX ? plotHeight - pad.axis.bottom + tickLength : undefined}
      color="var(--color-font-1)"
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
        color="var(color-font-2)"
      />
    {/if}
  </g>
  ) )
{/each}
