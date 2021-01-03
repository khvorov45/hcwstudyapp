import { ReactNode } from "react"
import { User } from "../lib/data"

export function AuthOnly({
  user,
  admin,
  children,
}: {
  user: User | null | undefined
  admin?: boolean
  children: ReactNode
}) {
  if (!user) {
    return <></>
  }
  if (admin && user.accessGroup !== "admin") {
    return <></>
  }
  return <>{children}</>
}
