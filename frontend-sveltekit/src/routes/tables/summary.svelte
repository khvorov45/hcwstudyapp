<script lang="ts">
  import TextContainer from "$lib/components/TextContainer.svelte"
  import Link from "$lib/components/Link.svelte"
</script>

<TextContainer>
  <h3>Summary is now split into two tables:</h3>
  <ul>
    <li><Link href="/tables/demographics">Demographics</Link></li>
    <li><Link href="/tables/summary-titre">Titres</Link></li>
  </ul>
</TextContainer>

<style>
  li {
    font-size: 16px;
    margin-bottom: 10px;
  }
</style>
