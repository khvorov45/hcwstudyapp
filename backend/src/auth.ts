import randomString from "crypto-random-string"
import SHA512 from "crypto-js/sha512"
import { Token, TokenType } from "./data"
import { addDays } from "./util"

export function createToken(
  user: string,
  tokenDaysToLive: number,
  type: TokenType
): Token {
  return {
    user,
    token: generateToken(),
    type,
    expires: addDays(new Date(), tokenDaysToLive),
  }
}

export function generateToken(): string {
  return randomString({ length: 40, type: "url-safe" })
}

export function hash(s: string): string {
  return SHA512(s).toString()
}
