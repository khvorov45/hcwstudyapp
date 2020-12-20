import randomString from "crypto-random-string"
import SHA512 from "crypto-js/sha512"
import { Token } from "./data"

function addDays(date: Date, days: number): Date {
  date.setDate(date.getDate() + days)
  return date
}

export function createToken(user: string, tokenDaysToLive: number): Token {
  return {
    user,
    token: generateToken(),
    expires: addDays(new Date(), tokenDaysToLive),
  }
}

export function generateToken(): string {
  return randomString({ length: 40, type: "url-safe" })
}

export function hash(s: string): string {
  return SHA512(s).toString()
}
