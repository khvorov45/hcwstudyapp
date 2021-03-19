import { writable } from "svelte/store"
import type { User } from "./data"
import type { AsyncStatus } from "./util"

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

export const loginStatus = writable({
  status: "not-requested",
  user: null,
  error: null,
} as {
  status: AsyncStatus
  user: any | null
  error: string | null
})

export const usersTable = writable({
  status: "not-requested",
  data: null,
  error: null,
} as {
  status: AsyncStatus
  data: User[] | null
  error: string | null
})
