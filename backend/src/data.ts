import * as t from "io-ts"
import { date } from "io-ts-types"

// https://github.com/gcanti/io-ts/blob/master/index.md#union-of-string-literals
export const AccessGroupV = t.keyof({
  admin: null,
  unrestricted: null,
  melbourne: null,
})
export type AccessGroup = t.TypeOf<typeof AccessGroupV>

export const UserV = t.type({
  email: t.string,
  accessGroup: AccessGroupV,
  tokenhash: t.string,
})
export type User = t.TypeOf<typeof UserV>

export const ParticipantV = t.type({
  redcapRecordId: t.string,
  pid: t.string,
  accessGroup: AccessGroupV,
  site: t.string,
  dateScreening: date,
  email: t.string,
  mobile: t.string,
  addBleed: t.boolean,
  dob: date,
  gender: t.string,
  withdrawn: t.string,
})
export type Participant = t.TypeOf<typeof ParticipantV>

export const FullDataV = t.type({ user: UserV })
export type FullData = t.TypeOf<typeof FullDataV>
