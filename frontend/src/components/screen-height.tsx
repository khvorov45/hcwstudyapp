import { ReactNode } from "react"
import { useWindowSize } from "../lib/hooks"

export default function ScreenHeight({
  heightTaken,
  children,
}: {
  heightTaken: number
  children: ReactNode
}) {
  const windowSize = useWindowSize()
  return (
    <div
      style={{
        height: windowSize.height - heightTaken,
        overflowY: "scroll",
        // Expect children to handle their own horizontal scrolling
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  )
}
