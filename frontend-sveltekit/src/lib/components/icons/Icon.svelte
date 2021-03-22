<script lang="ts">
  export let viewBox: string = "0 0 24 24"
  export let color: "text" | "primary" | "secondary" = "text"
</script>

<svg
  class:primary={color === "primary"}
  class:secondary={color === "secondary"}
  {viewBox}><slot /></svg
>

<style>
  svg {
    width: var(--size-icon);
    height: var(--size-icon);
    fill: var(--color-font-1);
    transition: fill var(--time-transition);
  }
  .primary {
    fill: var(--color-primary-3);
  }
  .secondary {
    fill: var(--color-secondary-3);
  }
</style>
