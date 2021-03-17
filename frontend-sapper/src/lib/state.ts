import { writable } from "svelte/store"

function createLocalStore<T>(key: string, startValue: T | null) {
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
      })
    },
  }
}

export const token = createLocalStore("token", null)

export const loginStatus = writable({
  status: "not-requested",
  user: null,
  error: null,
} as {
  status: "success" | "error" | "loading" | "not-requested"
  user: any | null
  error: string | null
})
