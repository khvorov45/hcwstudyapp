<script lang="ts">
  import Button from "./Button.svelte"
</script>

<div class="subnav">
  <div class="element">
    <Button width="100px" active height="var(--size-nav)">Contact</Button>
  </div>
</div>

<style>
  .subnav {
    height: var(--size-nav);
    border-bottom: 1px solid var(--color-bg-2);
  }
</style>
