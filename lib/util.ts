export function getConstQuery (query) {
  var constQuery = ''
  if (query.id && query.token) {
    constQuery = `?id=${query.id}&token=${query.token}`
  }
  return constQuery
}
