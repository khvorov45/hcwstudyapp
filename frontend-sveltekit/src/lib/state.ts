import { writable } from "svelte/store"
import type {
  Participant,
  Schedule,
  Serology,
  Site,
  User,
  VaccinationHistory,
  Virus,
  WeeklySurvey,
  Withdrawn,
} from "$lib/data"
import { isOccupationNotOther } from "$lib/data"
import {
  apiReq,
  rollup,
  summariseCount,
  summariseLogmean,
  summariseNumeric,
  summariseProportion,
} from "$lib/util"
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
export const lastRefresh = createLocalStore("last-refresh", null)

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

export const participantsReq = createApiStore<
  { token: string | null },
  Participant[]
>(({ token }) => ({
  method: "GET",
  token,
  url: "participants",
  expectContent: "json",
}))

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

function createTableExtraStore<T, A>(gen: (args: A) => T[]) {
  const { subscribe, set, update } = writable<{
    init: boolean
    result: T[]
  }>({
    init: false,
    result: [],
  })
  return {
    subscribe,
    set,
    update,
    gen: (args: A) => {
      let res = gen(args)
      update((current) => {
        current.init = true
        current.result = res
        return current
      })
    },
  }
}

export type ParticipantExtra = Participant & {
  priorVacs: number[]
  priorVacs5YearBeforeScreening: number
}

export const participantsExtra = createTableExtraStore(
  ({
    participants,
    vaccinations,
  }: {
    participants: Participant[]
    vaccinations: VaccinationHistory[]
  }) => {
    return participants.map((p) => {
      const vaccinatedYears = vaccinations
        .filter(
          (v) =>
            v.pid === p.pid &&
            (v.status === "Australia" || v.status === "Overseas")
        )
        .map((v) => v.year)
      const screeningYear = new Date(p.date_screening).getFullYear()
      return {
        priorVacs: vaccinatedYears,
        priorVacs5YearBeforeScreening: vaccinatedYears.filter(
          (vYear) => vYear < screeningYear && vYear >= screeningYear - 5
        ).length,
        ...p,
      }
    })
  }
)

export type SerologyExtra = Serology & {
  site: string
  priorVacs: number[]
  priorVacs5YearBeforeBleed: number
}

export const serologyExtra = createTableExtraStore(
  ({
    serology,
    participants,
  }: {
    serology: Serology[]
    participants: ParticipantExtra[]
  }) =>
    serology.map((s) => {
      const p = participants.find((p) => p.pid === s.pid)
      const priorVacs = p?.priorVacs ?? []
      return {
        site: p?.site ?? "(missing)",
        priorVacs: p?.priorVacs ?? [],
        priorVacs5YearBeforeBleed: priorVacs.filter(
          (x) => x < s.year && x >= s.year - 5
        ).length,
        ...s,
      }
    })
)

export type TitreChanges = {
  pid: string
  site: Site
  priorVacs5YearsBeforeBleed: number
  year: number
  virus: string
  titreChangeD0D14: number
  seroconversionD0D14: boolean
}

export const titreChanges = createTableExtraStore(
  ({
    serology,
    studyYears,
    viruses,
    participants,
  }: {
    serology: SerologyExtra[]
    studyYears: number[]
    viruses: Virus[]
    participants: Participant[]
  }) => {
    const titreChanges: any[] = []
    for (let studyYear of studyYears) {
      const serologyYear = serology.filter((x) => x.year === studyYear)
      for (let virus of viruses) {
        const serologyVirusYear = serologyYear.filter(
          (x) => x.virus === virus.name
        )
        for (let participant of participants) {
          const serologyVirusYearPid = serologyVirusYear.filter(
            (x) => x.pid === participant.pid
          )
          const d14 =
            serologyVirusYearPid.find((x) => x.day === 14)?.titre ?? null
          const d0 =
            serologyVirusYearPid.find((x) => x.day === 0)?.titre ?? null
          let titreChangeD0D14 = null
          if (d14 !== null && d0 !== null) {
            titreChangeD0D14 = d14 / d0
          }

          const priorVacs5YearsBeforeBleed =
            serologyVirusYearPid[0]?.priorVacs5YearBeforeBleed ?? null

          if (titreChangeD0D14 !== null) {
            titreChanges.push({
              pid: participant.pid,
              site: participant.site,
              virus: virus.name,
              year: studyYear,
              priorVacs5YearsBeforeBleed,
              titreChangeD0D14,
              seroconversionD0D14: titreChangeD0D14 >= 4,
            })
          }
        }
      }
    }
    return titreChanges
  }
)

function createSummaryStore<T extends Object, S extends Object>(
  summarise: (arr: T[]) => S
) {
  const { subscribe, set, update } = writable<{
    init: boolean
    result: S
  }>({
    init: false,
    result: null,
  })
  return {
    subscribe,
    set,
    update,
    gen: (table: T[]) => {
      update((current) => {
        current.init = true
        current.result = summarise(table)
        return current
      })
    },
  }
}

export const serologySummary = createSummaryStore((v: SerologyExtra[]) => {
  const summarise = (data) =>
    summariseLogmean(
      data.map((row) => row.titre),
      0
    )
  return {
    overall: rollup(
      v,
      (d) => ({ year: d.year, day: d.day, virus: d.virus }),
      summarise
    ),
    site: rollup(
      v,
      (d) => ({ year: d.year, day: d.day, virus: d.virus, site: d.site }),
      summarise
    ),
    priorVacs5YearBeforeBleed: rollup(
      v,
      (d) => ({
        year: d.year,
        day: d.day,
        virus: d.virus,
        priorVacs5YearBeforeBleed: d.priorVacs5YearBeforeBleed,
      }),
      summarise
    ),
  }
})

export const titreChangesSummary = createSummaryStore((v: TitreChanges[]) => {
  const summarise = (data: TitreChanges[]) => ({
    gmr: summariseLogmean(
      data.map((row) => row.titreChangeD0D14),
      0
    ),
    seroconversion: summariseProportion(
      data.map((row) => row.seroconversionD0D14)
    ),
  })
  return {
    overall: rollup(v, (d) => ({ year: d.year, virus: d.virus }), summarise),
    site: rollup(
      v,
      (d) => ({ year: d.year, virus: d.virus, site: d.site }),
      summarise
    ),
    priorVacs5YearBeforeBleed: rollup(
      v,
      (d) => ({
        year: d.year,
        virus: d.virus,
        priorVacs5YearsBeforeBleed: d.priorVacs5YearsBeforeBleed,
      }),
      summarise
    ),
  }
})

export const participantsSummary = createSummaryStore(
  (v: ParticipantExtra[]) => {
    function summary(v: ParticipantExtra[]) {
      return {
        count: summariseCount(v),
        age: summariseNumeric(v.map((d) => d.age_recruitment)),
        gender: rollup(v, (d) => ({ gender: d.gender }), summariseCount),
        height: summariseNumeric(v.map((d) => d.height)),
        weight: summariseNumeric(v.map((d) => d.weight)),
        bmi: summariseNumeric(v.map((d) => d.bmi)),
        occupation: rollup(
          v,
          (d) => ({
            occupation: isOccupationNotOther(d.occupation)
              ? d.occupation
              : "Other",
          }),
          summariseCount
        ),
      }
    }
    return {
      overall: rollup(v, (d) => ({}), summary),
      site: rollup(v, (d) => ({ site: d.site }), summary),
      priorVacs5YearBeforeScreening: rollup(
        v,
        (d) => ({
          priorVacs5YearBeforeScreening: d.priorVacs5YearBeforeScreening,
        }),
        summary
      ),
      sitePriorVacCounts: rollup(
        v,
        (d) => ({
          site: d.site,
          priorVacs5YearBeforeScreening: d.priorVacs5YearBeforeScreening,
        }),
        summariseCount
      ),
    }
  }
)
