import { writable } from "svelte/store"

function createLocalStore<T>(
  key: string,
  startValue: T | null,
  toString: (x: T) => string,
  fromString: (x: string) => T
) {
  const { subscribe, set, update } = writable(startValue)
  let localStorageInit = false

  return {
    subscribe,
    set,
    update,
    localStorageInit,
    useLocalStorage: () => {
      const json = localStorage.getItem(key)
      if (json) {
        set(fromString(json))
      }

      subscribe((current) => {
        localStorage.setItem(key, toString(current))
      })
      localStorageInit = true
    },
  }
}

export const token = createLocalStore(
  "token",
  null,
  (x) => x,
  (x) => x
)

export const loginStatus = writable({
  status: "not-requested",
  user: null,
  error: null,
} as {
  status: "success" | "error" | "loading" | "not-requested"
  user: any | null
  error: string | null
})
