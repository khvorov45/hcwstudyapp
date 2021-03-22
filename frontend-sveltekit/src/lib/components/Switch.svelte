<script lang="ts">
  export let checked = false
</script>

<div class="switch">
  <div class="label"><slot /></div>
  <input type="checkbox" class="toggle" bind:checked />
</div>

<style>
  .switch {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .label {
    margin-right: 10px;
  }

  .toggle:focus {
    outline: 0;
  }

  .toggle {
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    height: 32px;
    width: 52px;
    border-radius: 16px;
    display: inline-block;
    position: relative;
    margin: 0;
    border: 2px solid var(--color-bg-3);
    transition: background-color var(--time-transition),
      border-color var(--time-transition);
  }
  .toggle:after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-bg-3);
    transition: transform var(--time-transition),
      background-color var(--time-transition);
  }
  .toggle:checked {
    border-color: var(--color-primary-3);
  }
  .toggle:checked:after {
    transform: translatex(20px);
    background: var(--color-primary-3);
  }
</style>
