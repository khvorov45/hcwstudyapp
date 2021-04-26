import { writable } from "svelte/store"
import type {
  Schedule,
  Serology,
  User,
  VaccinationHistory,
  Virus,
  WeeklySurvey,
  Withdrawn,
} from "$lib/data"
import { apiReq } from "$lib/util"
import type { ApiRequest, ApiResult } from "$lib/util"

export const scrollbarWidth = writable(0)

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

function createApiStore<A, R>(argsToReq: (x: A) => ApiRequest) {
  const { subscribe, set, update } = writable<ApiResult<R>>({
    status: "not-requested",
    result: null,
  })
  return {
    subscribe,
    set,
    update,
    execute: async (args: A) => {
      update((current) => {
        current.status = "loading"
        return current
      })
      let res = await apiReq<R>(argsToReq(args))
      update((current) => {
        current.status = res.error === null ? "success" : "error"
        current.result = res
        return current
      })
    },
  }
}

export const loginReq = createApiStore<{ token: string | null }, User>(
  ({ token }) => ({
    method: "GET",
    token: token,
    url: "auth/token/verify",
    expectContent: "json",
  })
)

export const usersReq = createApiStore<{ token: string | null }, User[]>(
  ({ token }) => ({
    method: "GET",
    token,
    url: "users",
    expectContent: "json",
  })
)

export const participantsReq = createApiStore<{ token: string | null }, User[]>(
  ({ token }) => ({
    method: "GET",
    token,
    url: "participants",
    expectContent: "json",
  })
)

export const vaccinationHistoryReq = createApiStore<
  { token: string | null },
  VaccinationHistory[]
>(({ token }) => ({
  method: "GET",
  token,
  url: "vaccination",
  expectContent: "json",
}))

export const scheduleReq = createApiStore<{ token: string | null }, Schedule[]>(
  ({ token }) => ({
    method: "GET",
    token,
    url: "schedule",
    expectContent: "json",
  })
)

export const weeklySurveyReq = createApiStore<
  { token: string | null },
  WeeklySurvey[]
>(({ token }) => ({
  method: "GET",
  token,
  url: "weekly-survey",
  expectContent: "json",
}))

export const withdrawnReq = createApiStore<
  { token: string | null },
  Withdrawn[]
>(({ token }) => ({
  method: "GET",
  token,
  url: "withdrawn",
  expectContent: "json",
}))

export const virusReq = createApiStore<{ token: string | null }, Virus[]>(
  ({ token }) => ({
    method: "GET",
    token,
    url: "virus",
    expectContent: "json",
  })
)

export const serologyReq = createApiStore<{ token: string | null }, Serology[]>(
  ({ token }) => ({
    method: "GET",
    token,
    url: "serology",
    expectContent: "json",
  })
)
