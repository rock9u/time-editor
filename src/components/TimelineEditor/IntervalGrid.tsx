import React, { useMemo, useCallback, useState } from 'react'
import { DateTime } from 'luxon'
import type {
  TimelineInterval,
  GridSettings,
  TimelineBounds,
} from '../../types/timeline'
import {
  timestampToPixels,
  pixelsToTimestamp,
  snapToGrid,
  calculatePixelsPerMs,
  intervalsOverlap,
} from '../../lib/timeline-utils'
import {
  TIMELINE_CONSTANTS,
  UI_CONSTANTS,
  TIMELINE_BEHAVIOR,
  TIMELINE_VIEW_MODES,
  BADGE_VIEW_CONSTANTS,
} from '../../lib/constants'

interface IntervalGridProps {
  intervals: TimelineInterval[]
  selectedIntervalIds: Set<string>
  gridSettings: GridSettings
  timelineBounds: TimelineBounds
  onIntervalSelect: (id: string) => void
  onIntervalCreate?: (startTime: number, endTime: number) => void
  className?: string
  preventOverlap?: boolean
  viewMode?: 'grid' | 'badge' // New prop for view mode
}

export function IntervalGrid({
  intervals,
  selectedIntervalIds,
  gridSettings,
  timelineBounds,
  onIntervalSelect,
  onIntervalCreate,
  className = '',
  preventOverlap = TIMELINE_BEHAVIOR.PREVENT_OVERLAP,
  viewMode = TIMELINE_VIEW_MODES.GRID,
}: IntervalGridProps) {
  // Calculate grid dimensions
  const gridDimensions = useMemo(() => {
    const pixelsPerGridUnit = TIMELINE_CONSTANTS.DEFAULT_PIXELS_PER_GRID_UNIT
    const pixelsPerMs = calculatePixelsPerMs(gridSettings, pixelsPerGridUnit)
    const totalWidth =
      (timelineBounds.maxDate - timelineBounds.minDate) * pixelsPerMs

    return {
      pixelsPerGridUnit,
      pixelsPerMs,
      totalWidth,
      gridUnitWidth: pixelsPerGridUnit,
    }
  }, [gridSettings, timelineBounds])

  // Enhanced grid lines rendering as per requirements
  const gridLines = useMemo(() => {
    const lines: Array<{
      position: number
      timestamp: number
      label: string
      isMajor: boolean // Major grid lines for better visual hierarchy
    }> = []

    // Start from the beginning of the timeline, snapped to the grid unit
    let currentDate = DateTime.fromMillis(timelineBounds.minDate)
    const endDate = DateTime.fromMillis(timelineBounds.maxDate)

    // Snap to the start of the current grid unit
    currentDate = currentDate.startOf(gridSettings.unit)

    // Iterate through grid lines
    while (currentDate <= endDate) {
      const timestamp = currentDate.toMillis()
      const position = timestampToPixels(
        timestamp,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )

      // Determine if this is a major grid line based on grid unit
      let isMajor = false
      let label = ''

      switch (gridSettings.unit) {
        case 'day':
          // Major lines for start of month, minor for other days
          isMajor = currentDate.day === 1
          label = currentDate.toFormat('MMM dd')
          break
        case 'month':
          // Major lines for start of year, minor for other months
          isMajor = currentDate.month === 1
          label = currentDate.toFormat('MMM yyyy')
          break
        case 'year':
          // All year lines are major
          isMajor = true
          label = currentDate.toFormat('yyyy')
          break
      }

      lines.push({
        position,
        timestamp,
        label,
        isMajor,
      })

      // Move to next grid unit using Luxon's plus method
      currentDate = currentDate.plus({
        [gridSettings.unit]: gridSettings.value,
      })
    }

    return lines
  }, [timelineBounds, gridSettings, gridDimensions.pixelsPerMs])

  // Interval creation state
  const [isCreating, setIsCreating] = useState(false)
  const [creationStart, setCreationStart] = useState<number | null>(null)
  const [creationEnd, setCreationEnd] = useState<number | null>(null)

  // Handle mouse events for interval creation
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const timestamp = pixelsToTimestamp(
        x,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )
      const snappedTimestamp = snapToGrid(timestamp, gridSettings)

      setIsCreating(true)
      setCreationStart(snappedTimestamp)
      setCreationEnd(snappedTimestamp)
    },
    [timelineBounds, gridDimensions.pixelsPerMs, gridSettings]
  )

  // Function to check if a new interval would overlap with existing ones
  const wouldOverlap = useCallback(
    (startTime: number, endTime: number): boolean => {
      if (!preventOverlap) return false

      const newInterval: TimelineInterval = {
        id: 'temp',
        startTime,
        endTime,
      }

      return intervals.some(existingInterval =>
        intervalsOverlap(newInterval, existingInterval)
      )
    },
    [intervals, preventOverlap]
  )

  // Enhanced mouse up handler with overlap prevention
  const handleMouseUp = useCallback(() => {
    if (!isCreating || !creationStart || !creationEnd) return

    const startTime = Math.min(creationStart, creationEnd)
    const endTime = Math.max(creationStart, creationEnd)

    // Ensure minimum duration
    if (endTime - startTime >= TIMELINE_CONSTANTS.MIN_INTERVAL_DURATION) {
      // Check for overlap if prevention is enabled
      if (wouldOverlap(startTime, endTime)) {
        // Show visual feedback that overlap is not allowed
        console.warn('Cannot create overlapping intervals')
        // You could add a toast notification here
        return
      }

      onIntervalCreate?.(startTime, endTime)
    }

    setIsCreating(false)
    setCreationStart(null)
    setCreationEnd(null)
  }, [isCreating, creationStart, creationEnd, onIntervalCreate, wouldOverlap])

  // Enhanced mouse move handler with overlap feedback
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isCreating) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const timestamp = pixelsToTimestamp(
        x,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )
      const snappedTimestamp = snapToGrid(timestamp, gridSettings)

      setCreationEnd(snappedTimestamp)
    },
    [isCreating, timelineBounds, gridDimensions.pixelsPerMs, gridSettings]
  )

  // Calculate interval positions for both grid and badge views
  const intervalElements = useMemo(() => {
    return intervals.map(interval => {
      const startLeft = timestampToPixels(
        interval.startTime,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )
      const endLeft = timestampToPixels(
        interval.endTime,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )
      const width =
        (interval.endTime - interval.startTime) * gridDimensions.pixelsPerMs
      const isSelected = selectedIntervalIds.has(interval.id)

      return {
        ...interval,
        startLeft,
        endLeft,
        width,
        isSelected,
      }
    })
  }, [
    intervals,
    selectedIntervalIds,
    timelineBounds,
    gridDimensions.pixelsPerMs,
  ])

  // Hover state for badge view
  const [hoveredIntervalId, setHoveredIntervalId] = useState<string | null>(
    null
  )

  // Render grid view intervals
  const renderGridIntervals = () => (
    <>
      {intervalElements.map(interval => (
        <div
          key={interval.id}
          className={`absolute top-8 bottom-2 rounded cursor-pointer transition-all ${
            interval.isSelected
              ? 'ring-2 ring-blue-500 ring-offset-1'
              : 'hover:ring-1 hover:ring-gray-300'
          }`}
          style={{
            left: `${interval.startLeft}px`,
            width: `${Math.max(interval.width, 20)}px`,
            backgroundColor: interval.metadata?.color || '#3B82F6',
            borderRadius: `${UI_CONSTANTS.INTERVAL_BORDER_RADIUS}px`,
          }}
          onClick={e => {
            e.stopPropagation()
            onIntervalSelect(interval.id)
          }}>
          {/* Interval Label */}
          <div className="px-2 py-1 text-xs text-white truncate">
            {interval.metadata?.label || 'Interval'}
          </div>
        </div>
      ))}
    </>
  )

  // Render badge view intervals
  const renderBadgeIntervals = () => (
    <>
      {intervalElements.map(interval => {
        const isHovered = hoveredIntervalId === interval.id
        const isSelected = selectedIntervalIds.has(interval.id)
        const color = interval.metadata?.color || '#3B82F6'

        return (
          <div
            key={interval.id}
            className="absolute top-8 bottom-2 cursor-pointer"
            onMouseEnter={() => setHoveredIntervalId(interval.id)}
            onMouseLeave={() => setHoveredIntervalId(null)}
            onClick={e => {
              e.stopPropagation()
              onIntervalSelect(interval.id)
            }}>
            {/* Start Badge */}
            <div
              className={`absolute rounded-full transition-all ${
                isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              style={{
                left: `${
                  interval.startLeft - BADGE_VIEW_CONSTANTS.BADGE_SIZE / 2
                }px`,
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${BADGE_VIEW_CONSTANTS.BADGE_SIZE}px`,
                height: `${BADGE_VIEW_CONSTANTS.BADGE_SIZE}px`,
                backgroundColor: color,
                opacity: isHovered ? BADGE_VIEW_CONSTANTS.HOVER_OPACITY : 1,
                zIndex: isHovered ? 10 : 1,
              }}
            />

            {/* Connection Line */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2"
              style={{
                left: `${interval.startLeft}px`,
                width: `${interval.width}px`,
                height: `${BADGE_VIEW_CONSTANTS.CONNECTION_LINE_WIDTH}px`,
                backgroundColor: color,
                opacity: isHovered
                  ? BADGE_VIEW_CONSTANTS.HOVER_OPACITY
                  : BADGE_VIEW_CONSTANTS.CONNECTION_OPACITY,
                zIndex: isHovered ? 5 : 1,
              }}
            />

            {/* End Badge */}
            <div
              className={`absolute rounded-full transition-all ${
                isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              style={{
                left: `${
                  interval.endLeft - BADGE_VIEW_CONSTANTS.BADGE_SIZE / 2
                }px`,
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${BADGE_VIEW_CONSTANTS.BADGE_SIZE}px`,
                height: `${BADGE_VIEW_CONSTANTS.BADGE_SIZE}px`,
                backgroundColor: color,
                opacity: isHovered
                  ? BADGE_VIEW_CONSTANTS.HOVER_OPACITY
                  : BADGE_VIEW_CONSTANTS.NORMAL_OPACITY,
                zIndex: isHovered ? 10 : 1,
              }}
            />

            {/* Interval Label (shown on hover) */}
            {isHovered && (
              <div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full px-2 py-1 text-xs text-white bg-gray-800 rounded whitespace-nowrap"
                style={{
                  backgroundColor: color,
                  zIndex: 20,
                }}>
                {interval.metadata?.label || 'Interval'}
              </div>
            )}
          </div>
        )
      })}
    </>
  )

  return (
    <div className={`relative ${className}`}>
      {/* Grid Container */}
      <div
        className="relative bg-white border border-gray-200 rounded"
        style={{
          width: `${gridDimensions.totalWidth}px`,
          height: `${UI_CONSTANTS.GRID_HEADER_HEIGHT + 100}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}>
        {/* Grid Lines */}
        {gridLines.map((line, index) => (
          <div
            key={index}
            className={`absolute top-0 bottom-0 ${
              line.isMajor
                ? 'border-l-2 border-gray-300'
                : 'border-l border-gray-100'
            }`}
            style={{ left: `${line.position}px` }}>
            {/* Grid Line Label */}
            <div
              className={`absolute top-1 left-1 text-xs px-1 rounded ${
                line.isMajor
                  ? 'text-gray-700 bg-white font-medium'
                  : 'text-gray-500 bg-gray-50'
              }`}>
              {line.label}
            </div>
          </div>
        ))}

        {/* Render intervals based on view mode */}
        {viewMode === TIMELINE_VIEW_MODES.BADGE
          ? renderBadgeIntervals()
          : renderGridIntervals()}

        {/* Creation Marquee */}
        {isCreating && creationStart && creationEnd && (
          <div
            className={`absolute top-8 bottom-2 border ${
              wouldOverlap(
                Math.min(creationStart, creationEnd),
                Math.max(creationStart, creationEnd)
              )
                ? 'bg-red-500 bg-opacity-30 border-red-500'
                : 'bg-blue-500 bg-opacity-30 border-blue-500'
            }`}
            style={{
              left: `${timestampToPixels(
                Math.min(creationStart, creationEnd),
                timelineBounds.minDate,
                gridDimensions.pixelsPerMs
              )}px`,
              width: `${
                Math.abs(creationEnd - creationStart) *
                gridDimensions.pixelsPerMs
              }px`,
            }}
          />
        )}
      </div>

      {/* Enhanced Grid Info */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex gap-4">
          <span>
            Grid: {gridSettings.value} {gridSettings.unit}(s)
          </span>
          <span>Width: {Math.round(gridDimensions.totalWidth)}px</span>
          <span>Intervals: {intervals.length}</span>
          <span>Grid Lines: {gridLines.length}</span>
          <span
            className={preventOverlap ? 'text-green-600' : 'text-orange-600'}>
            Overlap: {preventOverlap ? 'Prevented' : 'Allowed'}
          </span>
          <span className="text-blue-600">
            View: {viewMode === TIMELINE_VIEW_MODES.BADGE ? 'Badge' : 'Grid'}
          </span>
        </div>
      </div>
    </div>
  )
}
