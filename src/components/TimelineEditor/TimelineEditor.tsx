import React from 'react'
import { useTimelineReducer } from './useTimelineReducer'
import { generateUUID } from '../../lib/utils'
import { formatTimestamp, getDurationText } from '../../lib/timeline-utils'
import {
  INTERVAL_COLORS,
  DEFAULT_METADATA,
  UI_CONSTANTS,
  TIMELINE_CONSTANTS,
} from '../../lib/constants'

export function TimelineEditor() {
  const {
    intervals,
    selectedIntervalIds,
    addInterval,
    deleteInterval,
    clearSelectedIntervals,
    toggleIntervalSelection,
    getSelectedIntervals,
  } = useTimelineReducer()

  const handleAddTestInterval = () => {
    const now = Date.now()
    const colorIndex = intervals.length % INTERVAL_COLORS.length
    const newInterval = {
      id: generateUUID(),
      startTime: now,
      endTime: now + TIMELINE_CONSTANTS.MIN_INTERVAL_DURATION * 60 * 60, // 1 hour later
      metadata: {
        label: `${DEFAULT_METADATA.LABEL} ${intervals.length + 1}`,
        color: INTERVAL_COLORS[colorIndex],
        description: `This is a test interval created at ${formatTimestamp(
          now
        )}`,
        tags: ['test', 'demo'],
      },
    }
    addInterval(newInterval)
  }

  const handleDeleteSelected = () => {
    selectedIntervalIds.forEach(id => deleteInterval(id))
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Timeline Editor</h2>

      {/* Controls */}
      <div className="mb-4 space-x-2">
        <button
          onClick={handleAddTestInterval}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Add Test Interval
        </button>
        <button
          onClick={clearSelectedIntervals}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Clear Selection
        </button>
        <button
          onClick={handleDeleteSelected}
          disabled={selectedIntervalIds.size === 0}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50">
          Delete Selected ({selectedIntervalIds.size})
        </button>
      </div>

      {/* Intervals List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Intervals ({intervals.length})
        </h3>
        {intervals.map(interval => (
          <div
            key={interval.id}
            className={`p-3 border rounded cursor-pointer ${
              selectedIntervalIds.has(interval.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
            style={{
              borderRadius: `${UI_CONSTANTS.INTERVAL_BORDER_RADIUS}px`,
              minHeight: `${UI_CONSTANTS.INTERVAL_HEIGHT}px`,
            }}
            onClick={() => toggleIntervalSelection(interval.id)}>
            <div className="flex items-center gap-2">
              {interval.metadata?.color && (
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: interval.metadata.color }}
                />
              )}
              <div className="font-medium">
                {interval.metadata?.label || DEFAULT_METADATA.LABEL}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {formatTimestamp(interval.startTime)} -{' '}
              {formatTimestamp(interval.endTime)}
            </div>
            <div className="text-xs text-gray-500">
              Duration: {getDurationText(interval.startTime, interval.endTime)}
            </div>
            {interval.metadata?.tags && interval.metadata.tags.length > 0 && (
              <div className="mt-2 flex gap-1">
                {interval.metadata.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Intervals */}
      {selectedIntervalIds.size > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h4 className="font-semibold">Selected Intervals:</h4>
          <ul className="mt-2 space-y-1">
            {getSelectedIntervals().map(interval => (
              <li key={interval.id} className="text-sm">
                {interval.metadata?.label || DEFAULT_METADATA.LABEL}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
