import { getCumsum, scaleLinear, scaleLog, scaleOrdinal } from "./util"

test("scaleLinear", () => {
  // Simplest scaling
  expect(scaleLinear(0, [0, 1], [0, 100])).toStrictEqual(0)
  expect(scaleLinear(1, [0, 1], [0, 100])).toStrictEqual(100)
  expect(scaleLinear(0.5, [0, 1], [0, 100])).toStrictEqual(50)
  expect(scaleLinear(0.25, [0, 1], [0, 100])).toStrictEqual(25)
  expect(scaleLinear(0.75, [0, 1], [0, 100])).toStrictEqual(75)

  // Not centered
  expect(scaleLinear(5, [5, 6], [700, 800])).toStrictEqual(700)
  expect(scaleLinear(6, [5, 6], [700, 800])).toStrictEqual(800)
  expect(scaleLinear(5.75, [5, 6], [700, 800])).toStrictEqual(775)

  // Backwards
  expect(scaleLinear(5, [5, 6], [800, 700])).toStrictEqual(800)
  expect(scaleLinear(6, [5, 6], [800, 700])).toStrictEqual(700)
  expect(scaleLinear(5.75, [5, 6], [800, 700])).toStrictEqual(725)
})

test("scaleLog", () => {
  expect(scaleLog(4, [2, 8], [0, 100])).toStrictEqual(50)
})

test("scaleOrdinal", () => {
  const cats = ["a", "b", "c"]
  expect(scaleOrdinal("b", cats, [0, 100])).toStrictEqual(50)
  expect(scaleOrdinal("a", cats, [0, 100])).toStrictEqual(0)
  expect(scaleOrdinal("c", cats, [0, 100])).toStrictEqual(100)
})

test("getCumsum", () => {
  const arr = [0, 1, 2, 3, 4]
  const expectedCumsum = [0, 1, 3, 6, 10]
  getCumsum(arr).forEach((x, i) => expect(x).toStrictEqual(expectedCumsum[i]))
})
