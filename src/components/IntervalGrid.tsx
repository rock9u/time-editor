import { useState } from 'react'
import { DynamicCirclesInBigCircle } from './DynamicCirclesInBigCircle'

export const IntervalGrid = () => {
  const [data, setData] = useState([
    {
      id: 1,
      label: '1',
    },
    {
      id: 2,
      label: '2',
    },
  ])

  const circleSize = 'w-10 h-10'
  return (
    <div className="card">
      {data.length + 1}
      <button
        onClick={() => {
          setData(data => [
            ...data,
            { id: data.length + 1, label: (data.length + 1).toString() },
          ])
        }}>
        +
      </button>
      <div className={`grid grid-flow-col auto-cols-fr gap-1`}>
        {data.map((item, index) => (
          <div
            key={item.id || index} // Use a unique ID if available, otherwise index (less ideal for reordering)
            className={`
         ${circleSize}
         rounded-full
         flex items-center justify-center
         bg-blue-500 text-white
         font-bold text-lg
         shadow-lg
         cursor-pointer
         hover:bg-blue-600
         transition-colors duration-200
       `}>
            {/* Display content inside the circle, e.g., first letter of a name or a number */}
            {item.label || index + 1}
          </div>
        ))}
      </div>

      <div className="w-192 h-192 mx-auto my-auto">
        <DynamicCirclesInBigCircle data={data} />
      </div>
    </div>
  )
}
