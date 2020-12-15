import { ReactNode } from "react"
import { User } from "../lib/data"

export function AdminOnly({
  user,
  children,
}: {
  user: User | null | undefined
  children: ReactNode
}) {
  return <>{user?.accessGroup === "admin" ? children : <></>}</>
}

export function UserOnly({
  user,
  children,
}: {
  user: User | null | undefined
  children: ReactNode
}) {
  return <>{user ? children : <></>}</>
}
