export function getConstQuery (id: number, token: string) {
  var constQuery = ''
  if (id && token) {
    constQuery = `?id=${id}&token=${token}`
  }
  return constQuery
}
