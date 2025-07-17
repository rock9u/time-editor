import { useTimeline } from '@/contexts/TimelineContext'
import { getIntervalEndTime } from '@/lib/timeline-utils-v2'
import { DateTime } from 'luxon'
import type { TimelineIntervalV2 } from '@/types/timeline'

interface LayerVisualizationProps {
  intervals: TimelineIntervalV2[]
  selectedIntervalIds: Set<string>
  gridSettings: { unit: string; value: number }
  timelineBounds: { minDate: number; maxDate: number }
  onIntervalSelect: (id: string) => void
  onIntervalEdit: (interval: TimelineIntervalV2) => void
  className?: string
}

export function LayerVisualization({
  intervals,
  selectedIntervalIds,
  gridSettings,
  timelineBounds,
  onIntervalSelect,
  onIntervalEdit,
  className = '',
}: LayerVisualizationProps) {
  const { state, getLayerById } = useTimeline()
  
  // Calculate timeline dimensions
  const timelineWidth = 1200 // Base width
  const layerHeight = 60 // Height per layer
  const totalDuration = timelineBounds.maxDate - timelineBounds.minDate
  const pixelsPerMs = timelineWidth / totalDuration
  
  // Group intervals by layer
  const intervalsByLayer = new Map<string, TimelineIntervalV2[]>()
  
  intervals.forEach(interval => {
    const layerId = interval.layerId || 'default'
    if (!intervalsByLayer.has(layerId)) {
      intervalsByLayer.set(layerId, [])
    }
    intervalsByLayer.get(layerId)!.push(interval)
  })
  
  // Get visible layers in order
  const visibleLayers = state.layers.layerOrder
    .map(id => getLayerById(id))
    .filter((layer): layer is NonNullable<typeof layer> => layer !== undefined && layer.visible)
  
  const convertTimeToPixels = (timestamp: number): number => {
    return (timestamp - timelineBounds.minDate) * pixelsPerMs
  }
  
  const convertTimeToDuration = (interval: TimelineIntervalV2): number => {
    const endTime = getIntervalEndTime(interval)
    return (endTime - interval.startTime) * pixelsPerMs
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Layer Container */}
      <div 
        className="relative border rounded-lg overflow-hidden"
        style={{ 
          width: timelineWidth + 'px', 
          height: (visibleLayers.length * layerHeight) + 'px' 
        }}
      >
        {/* Layer Headers */}
        <div className="absolute left-0 top-0 w-48 bg-gray-50 dark:bg-gray-800 border-r z-10">
          {visibleLayers.map((layer, index) => (
            <div
              key={layer.id}
              className={`
                flex items-center px-3 py-2 border-b text-sm
                ${state.layers.activeLayerId === layer.id ? 'bg-blue-100 dark:bg-blue-900' : ''}
              `}
              style={{ 
                height: layerHeight + 'px',
                top: index * layerHeight + 'px'
              }}
            >
              <div 
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: layer.color }}
              />
              <span className="truncate font-medium">{layer.name}</span>
              <div className="ml-auto text-xs text-gray-500">
                {intervalsByLayer.get(layer.id)?.length || 0}
              </div>
            </div>
          ))}
        </div>
        
        {/* Timeline Grid */}
        <div className="absolute left-48 top-0 right-0 bottom-0">
          {/* Grid Lines */}
          <div className="absolute inset-0">
            {/* Generate grid lines based on grid settings */}
            {(() => {
              const lines = []
              const startDate = DateTime.fromMillis(timelineBounds.minDate)
              const endDate = DateTime.fromMillis(timelineBounds.maxDate)
              
              let currentDate = startDate.startOf(gridSettings.unit as any)
              let lineIndex = 0
              
              while (currentDate < endDate && lineIndex < 100) {
                const x = convertTimeToPixels(currentDate.toMillis())
                
                if (x >= 0 && x <= timelineWidth) {
                  lines.push(
                    <div
                      key={lineIndex}
                      className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
                      style={{ left: x + 'px' }}
                    />
                  )
                }
                
                currentDate = currentDate.plus({ [gridSettings.unit]: gridSettings.value })
                lineIndex++
              }
              
              return lines
            })()}
          </div>
          
          {/* Layer Backgrounds */}
          {visibleLayers.map((layer, index) => (
            <div
              key={layer.id}
              className="absolute left-0 right-0 border-b border-gray-100 dark:border-gray-800"
              style={{
                top: index * layerHeight + 'px',
                height: layerHeight + 'px',
                backgroundColor: layer.color ? `${layer.color}10` : 'transparent',
                opacity: layer.opacity,
              }}
            />
          ))}
          
          {/* Intervals */}
          {visibleLayers.map((layer, layerIndex) => {
            const layerIntervals = intervalsByLayer.get(layer.id) || []
            
            return layerIntervals.map(interval => {
              const x = convertTimeToPixels(interval.startTime)
              const width = convertTimeToDuration(interval)
              const y = layerIndex * layerHeight + 8
              const height = layerHeight - 16
              
              const isSelected = selectedIntervalIds.has(interval.id)
              
              return (
                <div
                  key={interval.id}
                  className={`
                    absolute cursor-pointer rounded transition-all duration-200
                    ${isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900' 
                      : 'hover:shadow-md'
                    }
                  `}
                  style={{
                    left: x + 'px',
                    width: Math.max(width, 20) + 'px',
                    top: y + 'px',
                    height: height + 'px',
                    backgroundColor: interval.metadata?.color || layer.color || '#3b82f6',
                    opacity: layer.opacity,
                  }}
                  onClick={() => onIntervalSelect(interval.id)}
                  onDoubleClick={() => onIntervalEdit(interval)}
                >
                  <div className="px-2 py-1 text-xs text-white truncate">
                    {interval.metadata?.label || 'Interval'}
                  </div>
                </div>
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}

// Mini Layer Indicator Component
interface LayerIndicatorProps {
  className?: string
}

export function LayerIndicator({ className = '' }: LayerIndicatorProps) {
  const { state } = useTimeline()
  const activeLayer = state.layers.layers.find(layer => layer.id === state.layers.activeLayerId)
  
  if (!activeLayer) return null
  
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <div 
        className="w-3 h-3 rounded"
        style={{ backgroundColor: activeLayer.color }}
      />
      <span className="font-medium">Layer:</span>
      <span>{activeLayer.name}</span>
    </div>
  )
}