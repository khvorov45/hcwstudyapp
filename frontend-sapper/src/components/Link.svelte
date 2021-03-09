<script lang="ts">
  export let href = ""
</script>

<a {href}><slot /></a>

<style>
  a {
    color: var(--color-primary-3);
    text-decoration: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0);
    transition: border-bottom var(--time-transition);
  }
  a:hover,
  a:focus {
    border-bottom: 1px solid var(--color-primary-3);
  }
</style>
