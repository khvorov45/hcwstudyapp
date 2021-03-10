<script lang="ts">
  import Link from "../components/Link.svelte"
  import TextContainer from "../components/TextContainer.svelte"
  import { loginStatus } from "../lib/state"
</script>

<TextContainer>
  <h1>Site map</h1>

  <ul>
    <li><Link href="/">Home page</Link></li>
    {#if $loginStatus.status === "success"}
      <li><Link href="tables">Tables</Link></li>
    {/if}
    <li><Link href="email">Email (get access links)</Link></li>
    <li><Link href="search">Search (this page)</Link></li>
  </ul>
</TextContainer>

<style>
  ul {
    font-size: 16px;
  }
  li {
    margin-top: 10px;
    margin-bottom: 10px;
  }
</style>
