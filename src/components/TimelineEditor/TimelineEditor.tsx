import React, { useState } from 'react'
import { useTimelineReducer } from './useTimelineReducer'
import { IntervalGrid } from './IntervalGrid'
import { IntervalEditDialog } from './IntervalEditDialog'
import { generateUUID } from '../../lib/utils'
import { formatTimestamp, getDurationText } from '../../lib/timeline-utils'
import {
  INTERVAL_COLORS,
  DEFAULT_METADATA,
  UI_CONSTANTS,
  TIMELINE_CONSTANTS,
  DEFAULT_GRID_SETTINGS,
  DEFAULT_TIMELINE_BOUNDS,
  TIMELINE_BEHAVIOR,
  TIMELINE_VIEW_MODES,
} from '../../lib/constants'
import type {
  GridSettings,
  TimelineBounds,
  GridIntervalUnit,
  TimelineInterval,
} from '../../types/timeline'

export function TimelineEditor() {
  const {
    intervals,
    selectedIntervalIds,
    addInterval,
    deleteInterval,
    updateInterval,
    clearSelectedIntervals,
    toggleIntervalSelection,
    getSelectedIntervals,
    setSelectedIntervals,
  } = useTimelineReducer()

  // Grid settings state
  const [gridSettings, setGridSettings] = useState<GridSettings>(
    DEFAULT_GRID_SETTINGS
  )
  const [timelineBounds] = useState<TimelineBounds>(DEFAULT_TIMELINE_BOUNDS)

  // Overlap prevention state
  const [preventOverlap, setPreventOverlap] = useState<boolean>(
    TIMELINE_BEHAVIOR.PREVENT_OVERLAP
  )

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'badge'>(
    TIMELINE_VIEW_MODES.GRID
  )

  // Dialog state
  const [editingInterval, setEditingInterval] =
    useState<TimelineInterval | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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

  const handleIntervalCreate = (startTime: number, endTime: number) => {
    const colorIndex = intervals.length % INTERVAL_COLORS.length
    const newInterval = {
      id: generateUUID(),
      startTime,
      endTime,
      metadata: {
        label: `New Interval ${intervals.length + 1}`,
        color: INTERVAL_COLORS[colorIndex],
        description: `Created from ${formatTimestamp(
          startTime
        )} to ${formatTimestamp(endTime)}`,
        tags: ['created'],
      },
    }
    addInterval(newInterval)
  }

  const handleIntervalSelectRange = (startTime: number, endTime: number) => {
    // Find intervals that overlap with the selection range
    const overlappingIntervals = intervals.filter(interval => {
      const intervalStart = Math.max(interval.startTime, startTime)
      const intervalEnd = Math.min(interval.endTime, endTime)
      return intervalStart < intervalEnd
    })

    // Select all overlapping intervals
    const intervalIds = overlappingIntervals.map(interval => interval.id)
    setSelectedIntervals(intervalIds)
  }

  const handleIntervalUpdate = (
    id: string,
    updates: Partial<TimelineInterval>
  ) => {
    updateInterval(id, updates)
  }

  const handleIntervalEdit = (interval: TimelineInterval) => {
    setEditingInterval(interval)
    setIsEditDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false)
    setEditingInterval(null)
  }

  const handleEditDialogSave = (
    id: string,
    updates: Partial<TimelineInterval>
  ) => {
    updateInterval(id, updates)
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

      {/* Grid Settings */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <h3 className="text-sm font-semibold mb-2">Grid Settings</h3>
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="text-xs text-gray-600">Unit:</label>
            <select
              value={gridSettings.unit}
              onChange={e =>
                setGridSettings(prev => ({
                  ...prev,
                  unit: e.target.value as GridIntervalUnit,
                }))
              }
              className="ml-2 px-2 py-1 text-sm border rounded">
              <option value="day">Day(s)</option>
              <option value="month">Month(s)</option>
              <option value="year">Year(s)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Value:</label>
            <input
              type="number"
              min="1"
              max="12"
              value={gridSettings.value}
              onChange={e =>
                setGridSettings(prev => ({
                  ...prev,
                  value: parseInt(e.target.value),
                }))
              }
              className="ml-2 px-2 py-1 text-sm border rounded w-16"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={preventOverlap}
                onChange={e => setPreventOverlap(e.target.checked)}
                className="rounded"
              />
              Prevent Overlap
            </label>
          </div>
          <div>
            <label className="text-xs text-gray-600">View Mode:</label>
            <select
              value={viewMode}
              onChange={e => setViewMode(e.target.value as 'grid' | 'badge')}
              className="ml-2 px-2 py-1 text-sm border rounded">
              <option value="grid">Grid</option>
              <option value="badge">Badge</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          Timeline {viewMode === TIMELINE_VIEW_MODES.BADGE ? 'Badge' : 'Grid'}{' '}
          View
        </h3>
        <div className="overflow-x-auto">
          <IntervalGrid
            intervals={intervals}
            selectedIntervalIds={selectedIntervalIds}
            gridSettings={gridSettings}
            timelineBounds={timelineBounds}
            onIntervalSelect={toggleIntervalSelection}
            onIntervalCreate={handleIntervalCreate}
            onIntervalUpdate={handleIntervalUpdate}
            onIntervalSelectRange={handleIntervalSelectRange}
            onIntervalEdit={handleIntervalEdit}
            preventOverlap={preventOverlap}
            viewMode={viewMode}
            className="min-w-full"
          />
        </div>
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

      {/* Edit Dialog */}
      <IntervalEditDialog
        interval={editingInterval}
        isOpen={isEditDialogOpen}
        onClose={handleEditDialogClose}
        onSave={handleEditDialogSave}
      />
    </div>
  )
}
