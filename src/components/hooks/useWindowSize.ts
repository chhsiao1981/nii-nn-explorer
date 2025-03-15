import { useEffect, useState } from 'react'

export default () => {
  const [widthAndHeight, setWidthAndHeight] = useState(() => [
    window.innerWidth,
    window.innerHeight,
  ])

  const handler = () => {
    if (
      Math.abs(window.innerWidth - widthAndHeight[0]) < 10 &&
      Math.abs(window.innerHeight - widthAndHeight[1]) < 10
    ) {
      return
    }

    setWidthAndHeight([window.innerWidth, window.innerHeight])
  }

  useEffect(() => {
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return widthAndHeight
}
