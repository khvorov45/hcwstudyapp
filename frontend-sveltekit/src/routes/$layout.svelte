<script lang="ts">
  import { onMount } from "svelte"
  import Nav from "$lib/components/Nav.svelte"
  import { token, loginStatus, theme } from "../lib/state"
  import { page } from "$app/stores"
  import Link from "$lib/components/Link.svelte"

  onMount(async () => {
    token.useLocalStorage()
    theme.useLocalStorage()
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
      res = await fetch(`${process.env.API_ROOT}/auth/token/verify`, {
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

    if (res.status === 200) {
      $loginStatus.status = "success"
      $loginStatus.user = await res.json()
    } else {
      $loginStatus.status = "error"
      $loginStatus.user = null
      const res_body = await res.text()
      if (res.status === 401) {
        $loginStatus.error = "UNAUTHORIZED: " + res_body
      } else {
        $loginStatus.error = "UNEXPECTED: " + res_body
      }
    }
  }

  async function refreshToken() {
    if ($loginStatus.status !== "success") {
      return
    }
    let res: any
    try {
      res = await fetch(`${process.env.API_ROOT}/auth/token`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${$token}`,
        },
      })
    } catch (e) {
      console.error("NETWORK ERROR on refresh: " + e.message)
      return
    }
    $token = await res.text()
  }

  const protectedRoutes = ["/tables"]
  $: segmentIsProtected = protectedRoutes.some((r) => $page.path === r)
</script>

<Nav />

<main>
  {#if segmentIsProtected}
    {#if $loginStatus.status === "error"}
      <p>
        {#if $loginStatus.error?.startsWith("UNAUTHORIZED")}
          Unauthorized to access this page. Get an access link on the <Link
            href="email">email page</Link
          >.
        {:else if $loginStatus.error?.startsWith("NETWORK")}
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

<style>
  :root {
    --color-font-1: rgb(230, 230, 230);
    --color-font-2: rgb(200, 200, 200);
    --color-bg-1: rgb(0, 0, 0);
    --color-bg-2: rgb(50, 50, 50);
    --color-bg-3: rgb(100, 100, 100);
    --color-primary-1: #303f9f;
    --color-primary-1-fade: #303f9f78;
    --color-primary-2: #3f51b5;
    --color-primary-2-fade: #3f51b578;
    --color-primary-3: #7986cb;
    --color-primary-3-fade: #7986cb78;
    --color-secondary-1: #c51162;
    --color-secondary-1-fade: #c5116278;
    --color-secondary-2: #f50057;
    --color-secondary-2-fade: #f5005778;
    --color-secondary-3: #ff4081;
    --color-secondary-3-fade: #ff408178;
    --color-error-1: #e57373;
    --size-icon-button: 40px;
    --size-icon: 35px;
    --size-nav: 40px;
    --time-transition: 0.3s;
    --invert-img: 100%;
  }

  :global([theme="light"]) {
    --color-font-1: rgb(0, 0, 0);
    --color-font-2: rgb(50, 50, 50);
    --color-bg-1: rgb(255, 255, 255);
    --color-bg-2: rgb(200, 200, 200);
    --color-bg-3: rgb(150, 150, 150);
    --color-primary-3: #303f9f;
    --color-primary-3-fade: #303f9f78;
    --color-primary-2: #3f51b5;
    --color-primary-2-fade: #3f51b578;
    --color-primary-1: #7986cb;
    --color-primary-1-fade: #7986cb78;
    --color-secondary-3: #c51162;
    --color-secondary-3-fade: #c5116278;
    --color-secondary-2: #f50057;
    --color-secondary-2-fade: #f5005778;
    --color-secondary-1: #ff4081;
    --color-secondary-1-fade: #ff408178;
    --color-error-1: #d32f2f;
    --invert-img: 0%;
  }

  :global(:focus) {
    outline: 0;
  }

  /* Prevent overflow that I don't control */
  :global(html) {
    overflow: hidden;
  }

  /* hr tag has some browser weirdness, so set it here to prevent surprises*/
  :global(hr) {
    border: 1px solid;
    color: var(--color-bg-2);
    background-color: var(--color-bg-2);
    border-color: var(--color-bg-2);
    transition: color var(--time-transition),
      background-color var(--time-transition),
      border-color var(--time-transition);
  }

  :global(body) {
    color: var(--color-font-1);
    background-color: var(--color-bg-1);
    font-size: 14px;
    transition: color var(--time-transition),
      background-color var(--time-transition),
      border-color var(--time-transition);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    margin: 0;
  }
</style>
