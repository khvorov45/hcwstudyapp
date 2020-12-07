import randomString from "crypto-random-string"
import SHA512 from "crypto-js/sha512"

export function generateToken(): string {
  return randomString({ length: 40, type: "url-safe" })
}

export function hash(s: string): string {
  return SHA512(s).toString()
}
