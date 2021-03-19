<script lang="ts">
  export let visible = false
  export let top = "0px"
  export let left = "0px"
</script>

{#if visible}
  <div class="popover-container">
    <div class="popover-content" style="top: {top}; left: {left}"><slot /></div>
  </div>
{/if}

<style>
  .popover-container {
    position: relative;
    z-index: 99;
  }
  .popover-content {
    position: absolute;
    background-color: var(--color-bg-1);
    transition: background-color var(--time-transition);
  }
</style>
