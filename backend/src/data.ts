import * as t from "io-ts"

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
  token: t.string,
})
export type User = t.TypeOf<typeof UserV>

export const FullDataV = t.type({ user: UserV })
export type FullData = t.TypeOf<typeof FullDataV>
