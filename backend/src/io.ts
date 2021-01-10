import * as t from "io-ts"
import { PathReporter } from "io-ts/PathReporter"
import { fold } from "fp-ts/Either"
import { pipe } from "fp-ts/function"

export function decode<T, O, I>(validator: t.Type<T, O, I>, input: I): T {
  const result = validator.decode(input)
  return pipe(
    result,
    fold(
      (_) => {
        throw Error("decode error: " + PathReporter.report(result))
      },
      (value) => value
    )
  )
}
