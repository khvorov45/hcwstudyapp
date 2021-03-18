<script lang="ts">
  import { createEventDispatcher } from "svelte"

  const dispatch = createEventDispatcher()

  export let question = ""
  export let options = [""]
  export let selected = ""
  export let maxWidth = "auto"
</script>

<div class="container" style="max-width: {maxWidth}">
  <div class="question">{question}</div>
  <div class="option-container">
    {#each options as option}
      <div
        class="option"
        class:selected={selected === option}
        on:click={() => {
          selected = option
          dispatch("input")
        }}
      >
        {option}
      </div>
    {/each}
  </div>
</div>

<style>
  .question {
    text-align: center;
  }
  .option-container {
    display: flex;
    justify-content: space-evenly;
  }
  .option {
    cursor: pointer;
    padding: 5px;
    border: 1px solid var(--color-bg-2);
    transition: background-color var(--time-transition),
      border-color var(--time-transition);
    flex: 1;
    text-align: center;
    margin-right: 5px;
    text-transform: capitalize;
  }
  .option:last-child {
    margin-right: 0;
  }
  .option:hover,
  .option:active {
    background-color: var(--color-bg-2);
  }
  .option.selected {
    background-color: var(--color-primary-1);
  }
</style>
