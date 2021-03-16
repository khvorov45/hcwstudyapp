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
        await refreshToken()
      }
    }
  })

  async function login() {
    if ($token === null) {
      $loginStatus.status = "error"
      $loginStatus.user = null
      $loginStatus.error = "UNAUTHORIZED: token is missing"
      return
    }

    $loginStatus.status = "loading"
    $loginStatus.error = null

    let res: any
    try {
      res = await fetch("http://localhost:7001/auth/token/verify", {
        headers: {
          Authorization: `Bearer ${$token}`,
        },
      })
    } catch (e) {
      $loginStatus.status = "error"
      $loginStatus.user = null
      $loginStatus.error = "NETWORK_ERROR: " + e.message
      return
    }

    let res_body = await res.json()

    if (res.status === 200) {
      $loginStatus.status = "success"
      $loginStatus.user = res_body
    } else {
      $loginStatus.status = "error"
      $loginStatus.user = null
      if (res.status === 401) {
        $loginStatus.error = "UNAUTHORIZED" + res_body
      } else {
        $loginStatus.error = "UNEXPECTED" + res_body
      }
    }
  }

  async function refreshToken() {
    if ($loginStatus.status !== "success") {
      return
    }
    let res: any
    try {
      res = await fetch("http://localhost:7001/auth/token", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${$token}`,
        },
      })
    } catch (e) {
      console.error("NETWORK_ERROR on refresh: " + e.message)
      return
    }
    $token = await res.json()
  }

  const protectedRoutes = ["tables"]
  $: segmentIsProtected = protectedRoutes.some(
    (r) => segment !== undefined && segment.startsWith(r)
  )
</script>

<Nav {segment} />

<main>
  {#if segmentIsProtected}
    {#if $loginStatus.status === "error"}
      <p>
        {#if $loginStatus.error.startsWith("UNAUTHORIZED")}
          Unauthorized to access this page. Get an access link on the <a
            href="email">email page</a
          >.
        {:else if $loginStatus.error.startsWith("NETWORK")}
          Network error, check back later
        {:else}
          Unexpected error, check back later
        {/if}
      </p>
    {:else if $loginStatus.status === "success"}
      <slot />
    {:else}
      <p>Waiting for login</p>
    {/if}
  {:else}
    <slot />
  {/if}
</main>
