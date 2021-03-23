import { writable } from "svelte/store"
import type { User } from "$lib/data"
import { apiReq } from "$lib/util"
import type { ApiRequest, ApiResult, AsyncStatus } from "$lib/util"

function createLocalStore<T>(
  key: string,
  startValue: T | null,
  onSet: (value: T) => void = () => {}
) {
  const { subscribe, set, update } = writable(startValue)

  return {
    subscribe,
    set,
    update,
    useLocalStorage: () => {
      const json = localStorage.getItem(key)
      if (json) {
        set(JSON.parse(json))
      }

      subscribe((current) => {
        localStorage.setItem(key, JSON.stringify(current))
        onSet(current)
      })
    },
  }
}

export const token = createLocalStore("token", null)

export const theme = createLocalStore("theme", "dark", (theme) =>
  document.documentElement.setAttribute("theme", theme)
)

function createApiStore<T>(argsToReq: (x: T) => ApiRequest) {
  const { subscribe, set, update } = writable<ApiResult>({
    status: "not-requested",
    result: null,
  })
  return {
    subscribe,
    set,
    update,
    execute: async (args: T) => {
      update((current) => {
        current.status = "loading"
        return current
      })
      let res = await apiReq(argsToReq(args))
      update((current) => {
        current.status = res.error === null ? "success" : "error"
        current.result = res
        return current
      })
    },
  }
}

export const loginReq = createApiStore(
  ({ token }: { token: string | null }) => ({
    method: "GET",
    token: token,
    url: "auth/token/verify",
    expectContent: "json",
  })
)

export const usersTable = writable({
  status: "not-requested",
  data: null,
  error: null,
} as {
  status: AsyncStatus
  data: User[] | null
  error: string | null
})
