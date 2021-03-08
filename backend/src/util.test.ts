import { getWeek } from "./util"

test("getWeek", () => {
  expect(getWeek(new Date("2021-01-04"))).toEqual([2021, 1])
  expect(getWeek(new Date("2021-01-07"))).toEqual([2021, 1])
  expect(getWeek(new Date("2021-01-10"))).toEqual([2021, 1])
  expect(getWeek(new Date("2021-07-28"))).toEqual([2021, 30])
})
