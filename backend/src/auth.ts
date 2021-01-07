import randomString from "crypto-random-string"
import SHA512 from "crypto-js/sha512"
import { Token } from "./data"
import { addDays } from "./util"

export function createToken(user: string, tokenDaysToLive: number): Token {
  return {
    user,
    token: generateToken(),
    type: "session",
    expires: addDays(new Date(), tokenDaysToLive),
  }
}

export function generateToken(): string {
  return randomString({ length: 40, type: "url-safe" })
}

export function hash(s: string): string {
  return SHA512(s).toString()
}
