<script lang="ts">
  import Link from "../components/Link.svelte"
  import TextContainer from "../components/TextContainer.svelte"
  import { loginStatus } from "../lib/state"
</script>

<TextContainer>
  <h1>Reports for HCW flu study</h1>

  <p>Main site is <Link href="https://hcwflustudy.com">here</Link>.</p>

  <p>Site map is <Link href="search">here</Link>.</p>

  {#if $loginStatus.status === "error"}
    <p>Access link can be obtained <Link href="email">here</Link></p>
  {/if}
</TextContainer>
