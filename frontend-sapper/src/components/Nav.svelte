<script lang="ts">
  import { loginStatus } from "../lib/state"
  import Link from "./Link.svelte"

  export let segment: string | undefined
</script>

<nav>
  <div class:active={segment === undefined}><Link href="/">Home</Link></div>

  <div class:active={segment === "email"}><Link href="email">Email</Link></div>

  {#if $loginStatus.status === "success"}
    <div class:active={segment === "protected"}>
      <Link href="protected">Protected</Link>
    </div>
  {/if}
</nav>

<style>
  nav {
    display: flex;
  }
  nav > * {
    margin-left: 5px;
  }
  nav > *:last-child {
    margin-right: 5px;
  }
</style>
