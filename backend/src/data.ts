import * as t from "io-ts"
import { DateFromISOString } from "io-ts-types"

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
  dateScreening: DateFromISOString,
  email: t.string,
  mobile: t.string,
  addBleed: t.boolean,
  dob: DateFromISOString,
  gender: t.string,
  withdrawn: t.string,
})
export type Participant = t.TypeOf<typeof ParticipantV>
