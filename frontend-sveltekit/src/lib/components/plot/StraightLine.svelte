<script lang="ts">
  export let x = null
  export let y = null

  export let x1 = null
  export let x2 = null
  export let y1 = null
  export let y2 = null

  export let color = "gray"
</script>

{#if x !== null}
  <line x1={x} x2={x} {y1} {y2} stroke={color} />
{:else}
  <line {x1} {x2} y1={y} y2={y} stroke={color} />
{/if}
