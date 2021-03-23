<script lang="ts">
  import { onMount } from "svelte"
  import Nav from "$lib/components/Nav.svelte"
  import { token, theme, loginReq } from "../lib/state"
  import { page } from "$app/stores"
  import Link from "$lib/components/Link.svelte"
  import { apiErrorToString, apiReq } from "$lib/util"

  onMount(async () => {
    token.useLocalStorage()
    theme.useLocalStorage()
    await login()
    // Attempt to pull token from url
    if ($loginReq.status === "error") {
      const newToken = $page.query.get("token") ?? null
      if (newToken !== null && newToken !== $token) {
        token.set(newToken)
        await login()
        await refreshToken()
      }
    }
  })

  async function login() {
    if ($token === null) {
      $loginReq.status = "error"
      $loginReq.result = {
        data: null,
        error: {
          type: "backend",
          status: 401,
          message: "token is missing",
        },
      }
      return
    }

    await loginReq.execute({ token: $token })

    const e = $loginReq.result.error
    if (e !== null && !(e.type === "backend" && e.status === 401)) {
      console.error("login error: " + apiErrorToString(e))
    }
  }

  async function refreshToken() {
    if ($loginReq.status !== "success") {
      return
    }

    const res = await apiReq({
      url: "auth/token",
      method: "PUT",
      token: $token,
      expectContent: "text",
    })
    if (res.error !== null) {
      console.error("refresh error: " + apiErrorToString(res.error))
    } else {
      $token = res.data
    }
  }

  const protectedRoutes = ["/tables", "/users"]
  $: segmentIsProtected = protectedRoutes.some((r) => $page.path === r)
</script>

<Nav />

<main>
  {#if segmentIsProtected}
    {#if $loginReq.status === "error"}
      <p>
        {#if $loginReq.result.error?.type === "backend" && $loginReq.result.error?.status === 401}
          Unauthorized to access this page. Get an access link on the <Link
            href="/email">email page</Link
          >.
        {:else}
          Login error, check back later
        {/if}
      </p>
    {:else if $loginReq.status === "success"}
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
