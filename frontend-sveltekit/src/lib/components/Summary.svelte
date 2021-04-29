<script lang="ts">
  export let summary: { mean: any; low: any; high: any }
  export let format: (s: any) => string = (s) => `${s}`
</script>

{#if summary === null}
  <div />
{:else}
  <div class="container">
    <div class="mean">{format(summary.mean)}</div>
    <div class="interval">
      <div class="low">{format(summary.low)}</div>
      -
      <div class="high">{format(summary.high)}</div>
    </div>
  </div>
{/if}

<style>
  .container {
    display: flex;
    flex-direction: column;
  }
  .interval {
    display: flex;
    color: var(--color-font-2);
  }
  .mean {
    text-align: center;
  }
</style>
