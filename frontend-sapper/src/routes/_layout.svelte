<script lang="ts">
  import { onMount } from "svelte"
  import Nav from "../components/Nav.svelte"
  import { token, loginStatus } from "../lib/state"

  export let segment: string | undefined

  onMount(async () => {
    token.useLocalStorage()
    await login()
    // Attempt to pull token from url
    if ($loginStatus.status === "error") {
      const params = new URLSearchParams(document.location.search)
      const newToken = params.get("token")
      if (newToken !== null && newToken !== $token) {
        token.set(newToken)
        await login()
      }
    }
  })

  async function login() {
    if ($token === null) {
      $loginStatus.status = "error"
      $loginStatus.user = null
      $loginStatus.error = "token is missing"
    }
    $loginStatus.status = "loading"
    $loginStatus.error = null
    const res = await fetch("http://localhost:7001/auth/token/verify", {
      headers: {
        Authorization: `Bearer ${$token}`,
      },
    })
    if (res.status !== 200) {
      $loginStatus.status = "error"
      $loginStatus.user = null
      $loginStatus.error = await res.json()
    } else {
      $loginStatus.status = "success"
      $loginStatus.user = await res.json()
    }
  }

  const protectedRoutes = ["protected"]
  $: segmentIsProtected = protectedRoutes.some(
    (r) => segment !== undefined && segment.startsWith(r)
  )
</script>

<Nav {segment} />

<main>
  {#if segmentIsProtected}
    {#if $loginStatus.status === "error"}
      <p>
        Unauthorized to access this page. Get an access link on the <a
          href="email">email page</a
        >.
      </p>
    {:else if $loginStatus.status === "success"}
      <slot />
    {:else}
      Waiting for login
    {/if}
  {:else}
    <slot />
  {/if}
</main>
