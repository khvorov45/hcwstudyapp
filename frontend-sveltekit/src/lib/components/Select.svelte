<script lang="ts">
  import { createEventDispatcher } from "svelte"
  import Popover from "./Popover.svelte"

  const dispatch = createEventDispatcher()

  export let options: any[] = [""]
  export let label: string = ""
  export let selected: any = ""
  export let getLabel: (x: any) => string = (x) => x

  export let maxWidth: string = "auto"
  export let minWidth = "auto"
  export let width = "auto"
  export let placeholder = ""
  export let top = "0px"
  export let left = "0px"

  let optionsVisible = false

  $: isEmpty = selected === "" || selected === undefined || selected === null
</script>

<div
  class="container"
  class:non-empty={!isEmpty}
  style="max-width: {maxWidth}; min-width: {minWidth}; width: {width}"
  on:click={() => (optionsVisible = !optionsVisible)}
>
  <div class="label">
    <div class="name">
      {label}
    </div>
    <div class="selected-preview" class:placeholder={isEmpty}>
      {isEmpty ? placeholder : getLabel(selected)}
    </div>
  </div>
</div>

<Popover visible={optionsVisible} {top} {left}>
  <div class="options">
    {#each options as option}
      <div
        class="option"
        class:selected={selected === option}
        class:unselected={selected !== option}
        on:click={() => {
          if (selected === option) {
            selected = null
          } else {
            selected = option
          }
          dispatch("input")
        }}
      >
        {getLabel(option)}
      </div>
    {/each}
  </div>
</Popover>

<style>
  :root {
    --select-size-container-padding: 5px;
  }
  .container {
    display: flex;
    box-sizing: border-box;
    cursor: pointer;
    border: 1px solid var(--color-bg-2);
    padding: var(--select-size-container-padding);
    transition: background-color var(--time-transition),
      border-color var(--time-transition);
  }
  .container.non-empty {
    border-color: var(--color-primary-1);
  }
  .label {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: 100%;
  }
  .options {
    border: 1px solid var(--color-bg-2);
    background-color: var(--color-bg-1);
    transition: background-color var(--time-transition),
      border-color var(--time-transition);
  }
  .option {
    padding: var(--select-size-container-padding);
    text-align: center;
  }
  .option.selected {
    background-color: var(--color-primary-1);
  }
  .selected-preview {
    white-space: pre;
    overflow: hidden;
  }
  .selected-preview.placeholder {
    color: var(--color-font-2);
  }
  .option.unselected:hover,
  .option.unselected:focus,
  .container:hover,
  .container:focus {
    background-color: var(--color-bg-2);
  }
</style>
