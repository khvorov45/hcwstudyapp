<script lang="ts">
  export let variant: "icon" | "text" = "text"
  export let action: () => void = () => {}
  export let active = false
  export let maxWidth = "auto"
  export let minWidth = "auto"
  export let width = variant === "icon" ? "var(--size-icon-button)" : "auto"
  export let disabled = false
  export let loading = false
  export let success = false
  export let errorMsg = ""

  $: cantPress = disabled || loading || success
</script>

<div class="container">
  <div
    class="button"
    style="max-width: {maxWidth}; min-width: {minWidth}; width: {width}"
    class:icon={variant === "icon"}
    class:text={variant === "text"}
    class:active
    on:click={cantPress ? () => {} : action}
    on:keyup={(e) => e.key === "Enter" && action()}
    class:disabled={cantPress}
    class:success
    class:loading
    tabindex="0"
  >
    {#if loading}
      ...
    {:else if success}
      <slot name="success" />
    {:else}
      <slot />
    {/if}
  </div>
  <div class="error-message">{errorMsg}</div>
</div>

<style>
  .button {
    display: flex;
    cursor: pointer;
    user-select: none;
    align-items: center;
    justify-content: center;
    transition: background-color var(--time-transition),
      border-color var(--time-transition);
  }
  .button:hover,
  .button:focus {
    background-color: var(--color-bg-2);
  }
  .button:active {
    background-color: var(--color-bg-3);
  }
  .button.active {
    background-color: var(--color-primary-1);
  }
  .icon {
    border-radius: 100%;
    width: var(--size-icon-button);
    height: var(--size-icon-button);
  }
  .text {
    font-weight: bold;
    border: 1px solid var(--color-bg-2);
    padding: 5px;
  }
  .button.disabled {
    color: var(--color-font-2);
    background-color: var(--color-bg-1);
    cursor: not-allowed;
  }
  .button.disabled.success,
  .button.disabled.loading {
    cursor: default;
  }
  .error-message {
    color: var(--color-error-1);
  }
</style>
