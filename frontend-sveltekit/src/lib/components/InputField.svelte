<script lang="ts">
  export let label = ""
  export let value = ""

  export let width = "auto"
</script>

<div class="container" style="width: {width}">
  <div class="label">{label}</div>
  <input
    style="width: {width}"
    bind:value
    class:filled={value !== ""}
    on:input
  />
</div>

<style>
  input {
    color: inherit;
    background-color: inherit;
    border: 0;
    border-bottom: 2px solid var(--color-bg-2);
    padding-bottom: 5px;
    transition: border-color var(--time-transition);
  }
  input:hover,
  input:focus {
    border-color: var(--color-bg-3);
  }
  input.filled {
    border-color: var(--color-primary-1);
  }
</style>
