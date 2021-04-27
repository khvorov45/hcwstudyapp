<script lang="ts">
  export let summary
</script>

{#if summary === null}
  <div />
{:else}
  <div class="container">
    <div class="mean">{summary.mean.toFixed(0)}</div>
    <div class="interval">
      <div class="low">{summary.low.toFixed(0)}</div>
      -
      <div class="high">{summary.high.toFixed(0)}</div>
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
