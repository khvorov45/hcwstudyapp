<script lang="ts">
  import { loginStatus } from "../lib/state"

  export let segment: string | undefined
</script>

<nav>
  <a href="/" class:active={segment === undefined}>Home</a>

  <a href="email" class:active={segment === "email"}>Email</a>

  {#if $loginStatus.status === "success"}
    <a href="protected" class:active={segment === "protected"}>Protected</a>
  {/if}
</nav>
