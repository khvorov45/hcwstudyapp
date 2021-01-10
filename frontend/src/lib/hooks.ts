import { useState, useLayoutEffect } from "react"

// https://stackoverflow.com/questions/19014250/rerender-view-on-browser-resize-with-react#answer-19014495
export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener("resize", updateSize)
    updateSize()
    return () => window.removeEventListener("resize", updateSize)
  }, [])
  return size
}
