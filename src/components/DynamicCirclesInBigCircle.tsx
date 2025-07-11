import { useRef, useState, useEffect } from 'react'

export const DynamicCirclesInBigCircle = ({
  data,
  spiral = 0,
}: {
  data: { id: number; label: string }[]
  spiral?: number
}) => {
  const containerRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Update container size on mount and window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: (containerRef.current as HTMLElement).offsetWidth,
          height: (containerRef.current as HTMLElement).offsetHeight,
        })
      }
    }
    updateSize() // Set initial size
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  if (!data || data.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No circles to display.</p>
    )
  }

  // Define properties for the big circle and small circles
  const parentDiameter = containerSize.width // Assuming square container
  const smallCircleDiameter = 64 // Tailwind's w-16 or h-16 is 64px by default
  const smallCircleRadius = smallCircleDiameter / 2

  // Calculate the radius for the path of the small circles' centers
  // We subtract smallCircleRadius to ensure the small circles stay within the parent boundaries
  // And an additional 'padding' of 10px for visual comfort
  const bigCirclePathRadius = parentDiameter / 2 - smallCircleRadius - 10

  // Calculate the center point of the parent container
  const centerX = parentDiameter / 2
  const centerY = parentDiameter / 2

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full mx-auto bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
      {data.map((item, index) => {
        const circleLayers = data.length / 12
        // Calculate the angle for each circle
        // 2 * Math.PI is 360 degrees in radians
        const angle = (index / data.length) * (2 * Math.PI) * circleLayers

        const bigCirclePathRadiusWithSpiral =
          bigCirclePathRadius * Math.pow(Math.pow(1 - spiral, index + 1), 2)
        // Calculate the x, y coordinates for the center of the small circle
        const x = centerX + bigCirclePathRadiusWithSpiral * Math.cos(angle)
        const y = centerY + bigCirclePathRadiusWithSpiral * Math.sin(angle)

        // Position the circle by offsetting by its own half-width/height
        // to center it on the calculated x,y point
        const style = {
          left: `${x - smallCircleRadius}px`,
          top: `${y - smallCircleRadius}px`,
        }

        return (
          <div
            key={item.id || index}
            className={`
              absolute
              w-16 h-16 rounded-full
              flex items-center justify-center
              bg-blue-500 text-white
              font-bold text-lg
              shadow-md
              hover:bg-blue-600
              transition-colors duration-200
            `}
            style={style} // Apply the calculated position
          >
            {item.label || index + 1}
          </div>
        )
      })}
    </div>
  )
}
