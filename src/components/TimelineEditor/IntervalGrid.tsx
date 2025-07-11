import { DateTime } from 'luxon'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  BADGE_VIEW_CONSTANTS,
  MOUSE_CONSTANTS,
  TIMELINE_BEHAVIOR,
  TIMELINE_CONSTANTS,
  TIMELINE_VIEW_MODES,
  UI_CONSTANTS,
} from '../../lib/constants'
import {
  calculatePixelsPerMs,
  intervalsOverlap,
  pixelsToTimestamp,
  snapToGrid,
  timestampToPixels,
} from '../../lib/timeline-utils'
import {
  convertToLegacyInterval,
  getIntervalDuration,
} from '../../lib/timeline-utils-v2'
import type {
  GridSettings,
  TimelineBounds,
  TimelineInterval,
  TimelineIntervalV2,
} from '../../types/timeline'

interface IntervalGridProps {
  intervals: (TimelineIntervalV2 & { endTime: number })[]
  selectedIntervalIds: Set<string>
  gridSettings: GridSettings
  timelineBounds: TimelineBounds
  onIntervalSelect: (id: string) => void
  onIntervalCreate?: (startTime: number, endTime: number) => void
  onIntervalSelectRange?: (startTime: number, endTime: number) => void
  onIntervalUpdate?: (id: string, updates: Partial<TimelineInterval>) => void
  onIntervalEdit?: (interval: TimelineInterval) => void
  className?: string
  preventOverlap?: boolean
  viewMode?: 'grid' | 'badge'
}

export function IntervalGrid({
  intervals,
  selectedIntervalIds,
  gridSettings,
  timelineBounds,
  onIntervalSelect,
  onIntervalCreate,
  onIntervalSelectRange,
  onIntervalUpdate,
  onIntervalEdit,
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
      isMajor: boolean
    }> = []

    let currentDate = DateTime.fromMillis(timelineBounds.minDate)
    const endDate = DateTime.fromMillis(timelineBounds.maxDate)

    currentDate = currentDate.startOf(gridSettings.unit)

    while (currentDate <= endDate) {
      const timestamp = currentDate.toMillis()
      const position = timestampToPixels(
        timestamp,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )

      let isMajor = false
      let label = ''

      switch (gridSettings.unit) {
        case 'day':
          isMajor = currentDate.day === 1
          label = currentDate.toFormat('MMM dd')
          break
        case 'month':
          isMajor = currentDate.month === 1
          label = currentDate.toFormat('MMM yyyy')
          break
        case 'year':
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

      currentDate = currentDate.plus({
        [gridSettings.unit]: gridSettings.value,
      })
    }

    return lines
  }, [timelineBounds, gridSettings, gridDimensions.pixelsPerMs])

  // Enhanced interaction state
  const [interactionMode, setInteractionMode] = useState<
    'none' | 'creating' | 'selecting' | 'resizing'
  >('none')
  const [interactionStart, setInteractionStart] = useState<number | null>(null)
  const [interactionEnd, setInteractionEnd] = useState<number | null>(null)
  const [interactionMarquee, setInteractionMarquee] = useState<{
    left: number
    width: number
    isValid: boolean
    mode: 'creating' | 'selecting' | 'resizing'
  } | null>(null)

  // Simple drag state
  const [draggedIntervalId, setDraggedIntervalId] = useState<string | null>(
    null
  )
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [dragStartTime, setDragStartTime] = useState<number | null>(null)

  // Resize state
  const [resizingIntervalId, setResizingIntervalId] = useState<string | null>(
    null
  )
  const [resizeEdge, setResizeEdge] = useState<'start' | 'end' | null>(null)
  const [resizeStartX, setResizeStartX] = useState<number | null>(null)
  const [resizeStartTime, setResizeStartTime] = useState<number | null>(null)

  // Track mouse position and drag state
  const [isDragging, setIsDragging] = useState(false)
  const [lastClickTime, setLastClickTime] = useState<number>(0)
  const gridRef = useRef<HTMLDivElement>(null)

  // Function to check if a new interval would overlap with existing ones
  const wouldOverlap = useCallback(
    (startTime: number, endTime: number, excludeId?: string): boolean => {
      if (!preventOverlap) return false

      const newInterval: TimelineInterval = {
        id: 'temp',
        startTime,
        endTime,
      }

      return intervals.some(
        existingInterval =>
          existingInterval.id !== excludeId &&
          intervalsOverlap(newInterval, existingInterval)
      )
    },
    [intervals, preventOverlap]
  )

  // Enhanced mouse down handler
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!gridRef.current) return

      const currentTime = Date.now()
      const isDoubleClick =
        currentTime - lastClickTime < MOUSE_CONSTANTS.DOUBLE_CLICK_DELAY
      setLastClickTime(currentTime)

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const timestamp = pixelsToTimestamp(
        x,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )
      const snappedTimestamp = snapToGrid(timestamp, gridSettings)

      // Determine interaction mode based on click type
      const mode = isDoubleClick ? 'creating' : 'selecting'
      setInteractionMode(mode)
      setIsDragging(false)
      setDragStartX(x)
      setInteractionStart(snappedTimestamp)
      setInteractionEnd(snappedTimestamp)

      // Initialize marquee with snapped position
      const snappedLeft = timestampToPixels(
        snappedTimestamp,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )

      setInteractionMarquee({
        left: snappedLeft,
        width: 0,
        isValid: true,
        mode,
      })
    },
    [lastClickTime, timelineBounds, gridDimensions.pixelsPerMs, gridSettings]
  )

  // Handle interval drag start
  const handleIntervalMouseDown = useCallback(
    (e: React.MouseEvent, interval: TimelineInterval) => {
      e.stopPropagation()

      const rect = gridRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      setDraggedIntervalId(interval.id)
      setDragStartX(x)
      setDragStartTime(interval.startTime)
      setIsDragging(true)
    },
    []
  )

  // Handle resize start
  const handleResizeMouseDown = useCallback(
    (
      e: React.MouseEvent,
      interval: TimelineInterval,
      edge: 'start' | 'end'
    ) => {
      e.stopPropagation()

      const rect = gridRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      setResizingIntervalId(interval.id)
      setResizeEdge(edge)
      setResizeStartX(x)
      setResizeStartTime(
        edge === 'start' ? interval.startTime : interval.endTime
      )
      setInteractionMode('resizing')
      setIsDragging(true)
    },
    []
  )

  // Enhanced mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left

      if (
        resizingIntervalId &&
        resizeEdge &&
        resizeStartX !== null &&
        resizeStartTime !== null
      ) {
        // Handle interval resizing
        const deltaX = x - resizeStartX
        const deltaTime = deltaX / gridDimensions.pixelsPerMs
        const newTime = resizeStartTime + deltaTime

        // Snap to grid
        const snappedTime = snapToGrid(newTime, gridSettings)
        const interval = intervals.find(i => i.id === resizingIntervalId)

        if (interval) {
          let newStartTime = interval.startTime
          let newEndTime = interval.endTime

          if (resizeEdge === 'start') {
            newStartTime = snappedTime
            // Ensure start time is before end time
            if (newStartTime >= interval.endTime) {
              newStartTime =
                interval.endTime - TIMELINE_CONSTANTS.MIN_INTERVAL_DURATION
            }
          } else {
            newEndTime = snappedTime
            // Ensure end time is after start time
            if (newEndTime <= interval.startTime) {
              newEndTime =
                interval.startTime + TIMELINE_CONSTANTS.MIN_INTERVAL_DURATION
            }
          }

          // Check for overlap (excluding the resized interval)
          if (!wouldOverlap(newStartTime, newEndTime, resizingIntervalId)) {
            onIntervalUpdate?.(resizingIntervalId, {
              startTime: newStartTime,
              endTime: newEndTime,
            })
          }
        }
      } else if (
        draggedIntervalId &&
        dragStartX !== null &&
        dragStartTime !== null
      ) {
        // Handle interval dragging
        const deltaX = x - dragStartX
        const deltaTime = deltaX / gridDimensions.pixelsPerMs
        const newStartTime = dragStartTime + deltaTime

        // Snap to grid
        const snappedStartTime = snapToGrid(newStartTime, gridSettings)
        const interval = intervals.find(i => i.id === draggedIntervalId)

        if (interval) {
          const duration = interval.endTime - interval.startTime
          const finalStartTime = snappedStartTime
          const finalEndTime = finalStartTime + duration

          // Check for overlap (excluding the dragged interval)
          if (!wouldOverlap(finalStartTime, finalEndTime, draggedIntervalId)) {
            onIntervalUpdate?.(draggedIntervalId, {
              startTime: finalStartTime,
              endTime: finalEndTime,
            })
          }
        }
      } else if (interactionMode !== 'none') {
        // Handle creation/selection
        const timestamp = pixelsToTimestamp(
          x,
          timelineBounds.minDate,
          gridDimensions.pixelsPerMs
        )
        const snappedTimestamp = snapToGrid(timestamp, gridSettings)

        // Check if we're dragging (moved beyond threshold)
        if (
          dragStartX !== null &&
          Math.abs(x - dragStartX) > MOUSE_CONSTANTS.DRAG_THRESHOLD
        ) {
          setIsDragging(true)
        }

        setInteractionEnd(snappedTimestamp)

        // Update marquee based on mode
        const startTime = Math.min(interactionStart!, snappedTimestamp)
        const endTime = Math.max(interactionStart!, snappedTimestamp)
        const startLeft = timestampToPixels(
          startTime,
          timelineBounds.minDate,
          gridDimensions.pixelsPerMs
        )
        const endLeft = timestampToPixels(
          endTime,
          timelineBounds.minDate,
          gridDimensions.pixelsPerMs
        )

        let isValid = true
        if (interactionMode === 'creating') {
          isValid =
            endTime - startTime >= TIMELINE_CONSTANTS.MIN_INTERVAL_DURATION &&
            !wouldOverlap(startTime, endTime)
        }

        setInteractionMarquee({
          left: startLeft,
          width: endLeft - startLeft,
          isValid,
          mode: interactionMode,
        })
      }
    },
    [
      resizingIntervalId,
      resizeEdge,
      resizeStartX,
      resizeStartTime,
      draggedIntervalId,
      dragStartX,
      dragStartTime,
      interactionMode,
      interactionStart,
      timelineBounds,
      gridDimensions.pixelsPerMs,
      gridSettings,
      wouldOverlap,
      intervals,
      onIntervalUpdate,
    ]
  )

  // Enhanced mouse up handler
  const handleMouseUp = useCallback(() => {
    if (interactionMode === 'none' && !draggedIntervalId && !resizingIntervalId)
      return

    if (resizingIntervalId) {
      // Handle resize end - already handled in mouse move
      setResizingIntervalId(null)
      setResizeEdge(null)
      setResizeStartX(null)
      setResizeStartTime(null)
      setIsDragging(false)
      setInteractionMode('none')
    } else if (draggedIntervalId) {
      // Handle interval drop - already handled in mouse move
      setDraggedIntervalId(null)
      setDragStartX(null)
      setDragStartTime(null)
      setIsDragging(false)
    } else if (interactionMode === 'creating') {
      // Handle creation
      if (!interactionStart || !interactionEnd) return

      const startTime = Math.min(interactionStart, interactionEnd)
      const endTime = Math.max(interactionStart, interactionEnd)

      if (
        isDragging &&
        endTime - startTime >= TIMELINE_CONSTANTS.MIN_INTERVAL_DURATION
      ) {
        if (wouldOverlap(startTime, endTime)) {
          console.warn('Cannot create overlapping intervals')
          return
        }

        onIntervalCreate?.(startTime, endTime)
      }
    } else if (interactionMode === 'selecting') {
      // Handle range selection
      if (!interactionStart || !interactionEnd) return

      const startTime = Math.min(interactionStart, interactionEnd)
      const endTime = Math.max(interactionStart, interactionEnd)
      onIntervalSelectRange?.(startTime, endTime)
    }

    // Reset all interaction state
    setInteractionMode('none')
    setIsDragging(false)
    setInteractionStart(null)
    setInteractionEnd(null)
    setInteractionMarquee(null)
    setDragStartX(null)
  }, [
    interactionMode,
    draggedIntervalId,
    resizingIntervalId,
    interactionStart,
    interactionEnd,
    isDragging,
    onIntervalCreate,
    onIntervalSelectRange,
    wouldOverlap,
  ])

  // Handle mouse leave to cancel interaction
  const handleMouseLeave = useCallback(() => {
    if (interactionMode !== 'none' || draggedIntervalId || resizingIntervalId) {
      setInteractionMode('none')
      setIsDragging(false)
      setInteractionStart(null)
      setInteractionEnd(null)
      setInteractionMarquee(null)
      setDragStartX(null)
      setDraggedIntervalId(null)
      setDragStartTime(null)
      setResizingIntervalId(null)
      setResizeEdge(null)
      setResizeStartX(null)
      setResizeStartTime(null)
    }
  }, [interactionMode, draggedIntervalId, resizingIntervalId])

  // Handle double-click for editing
  const handleIntervalDoubleClick = useCallback(
    (interval: TimelineInterval) => {
      onIntervalEdit?.(interval)
    },
    [onIntervalEdit]
  )

  // Calculate interval positions for both grid and badge views
  const intervalElements = useMemo(() => {
    return intervals.map(interval => {
      // Convert V2 interval to legacy format for display
      const legacyInterval = convertToLegacyInterval(interval)

      const startLeft = timestampToPixels(
        legacyInterval.startTime,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )
      const endLeft = timestampToPixels(
        legacyInterval.endTime,
        timelineBounds.minDate,
        gridDimensions.pixelsPerMs
      )
      const width = getIntervalDuration(interval) * gridDimensions.pixelsPerMs
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

  // Render resize handles for grid view
  const renderGridResizeHandles = (
    interval: TimelineInterval & {
      startLeft: number
      endLeft: number
      width: number
      isSelected: boolean
    }
  ) => {
    const isResizing = resizingIntervalId === interval.id
    const isResizingStart = isResizing && resizeEdge === 'start'
    const isResizingEnd = isResizing && resizeEdge === 'end'

    return (
      <>
        {/* Start resize handle */}
        <div
          className={`absolute top-0 bottom-0 w-1 cursor-ew-resize transition-all ${
            isResizingStart
              ? 'bg-white shadow-lg'
              : 'bg-white bg-opacity-50 hover:bg-opacity-75'
          }`}
          style={{
            left: '0px',
            zIndex: isResizingStart ? 20 : 10,
          }}
          onMouseDown={e => handleResizeMouseDown(e, interval, 'start')}
        />
        {/* End resize handle */}
        <div
          className={`absolute top-0 bottom-0 w-1 cursor-ew-resize transition-all ${
            isResizingEnd
              ? 'bg-white shadow-lg'
              : 'bg-white bg-opacity-50 hover:bg-opacity-75'
          }`}
          style={{
            right: '0px',
            zIndex: isResizingEnd ? 20 : 10,
          }}
          onMouseDown={e => handleResizeMouseDown(e, interval, 'end')}
        />
      </>
    )
  }

  // Render resize handles for badge view
  const renderBadgeResizeHandles = (
    interval: TimelineInterval & {
      startLeft: number
      endLeft: number
      width: number
      isSelected: boolean
    }
  ) => {
    const isResizing = resizingIntervalId === interval.id
    const isResizingStart = isResizing && resizeEdge === 'start'
    const isResizingEnd = isResizing && resizeEdge === 'end'

    return (
      <>
        {/* Start resize handle */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full cursor-ew-resize transition-all ${
            isResizingStart
              ? 'bg-white shadow-lg ring-2 ring-blue-500'
              : 'bg-white bg-opacity-75 hover:bg-opacity-100 hover:ring-1 hover:ring-blue-300'
          }`}
          style={{
            left: `${interval.startLeft - 4}px`,
            zIndex: isResizingStart ? 20 : 10,
          }}
          onMouseDown={e => handleResizeMouseDown(e, interval, 'start')}
        />
        {/* End resize handle */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full cursor-ew-resize transition-all ${
            isResizingEnd
              ? 'bg-white shadow-lg ring-2 ring-blue-500'
              : 'bg-white bg-opacity-75 hover:bg-opacity-100 hover:ring-1 hover:ring-blue-300'
          }`}
          style={{
            left: `${interval.endLeft - 4}px`,
            zIndex: isResizingEnd ? 20 : 10,
          }}
          onMouseDown={e => handleResizeMouseDown(e, interval, 'end')}
        />
      </>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Grid Container */}
      <div
        ref={gridRef}
        className="relative bg-background text-foreground border border-gray-200 rounded"
        style={{
          width: `${gridDimensions.totalWidth}px`,
          height: `${UI_CONSTANTS.GRID_HEADER_HEIGHT + 100}px`,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}>
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
                  ? 'text-gray-700 bg-background font-medium'
                  : 'text-gray-500 bg-background'
              } whitespace-nowrap truncate cursor-default select-none`}
              style={{ zIndex: 1 }}>
              {line.label}
            </div>
          </div>
        ))}

        {/* Render intervals directly */}
        {intervalElements.map(interval => {
          const isHovered = hoveredIntervalId === interval.id
          const isSelected = selectedIntervalIds.has(interval.id)
          const isBeingDragged = draggedIntervalId === interval.id
          const isBeingResized = resizingIntervalId === interval.id
          const color = interval.metadata?.color || '#3B82F6'

          if (viewMode === 'badge') {
            return (
              <div
                key={interval.id}
                className={`absolute top-8 bottom-2 cursor-move ${
                  isBeingDragged || isBeingResized ? 'z-50' : ''
                }`}
                onMouseEnter={() => setHoveredIntervalId(interval.id)}
                onMouseLeave={() => setHoveredIntervalId(null)}
                onMouseDown={e => handleIntervalMouseDown(e, interval)}
                onClick={e => {
                  e.stopPropagation()
                  onIntervalSelect(interval.id)
                }}
                onDoubleClick={() => handleIntervalDoubleClick(interval)}>
                {/* Start Badge */}
                <div
                  className={`absolute rounded-full transition-all ${
                    isSelected
                      ? 'ring-2 ring-white ring-offset-2 shadow-lg'
                      : ''
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
                    filter: isSelected
                      ? 'brightness(1.2) drop-shadow(0 0 4px rgba(255,255,255,0.8))'
                      : 'none',
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
                    filter: isSelected
                      ? 'brightness(1.2) drop-shadow(0 0 2px rgba(255,255,255,0.6))'
                      : 'none',
                  }}
                />

                {/* End Badge */}
                <div
                  className={`absolute rounded-full transition-all ${
                    isSelected
                      ? 'ring-2 ring-white ring-offset-2 shadow-lg'
                      : ''
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
                    filter: isSelected
                      ? 'brightness(1.2) drop-shadow(0 0 4px rgba(255,255,255,0.8))'
                      : 'none',
                  }}
                />

                {/* Resize handles for badge view */}
                {(isHovered || isSelected) &&
                  renderBadgeResizeHandles(interval)}

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
          }

          // Grid view
          return (
            <div
              key={interval.id}
              className={`absolute top-8 bottom-2 rounded cursor-move transition-all ${
                isSelected
                  ? 'ring-2 ring-white ring-offset-2 shadow-lg'
                  : 'hover:ring-1 hover:ring-gray-300'
              } ${isBeingDragged || isBeingResized ? 'z-50 opacity-80' : ''}`}
              style={{
                left: `${interval.startLeft}px`,
                width: `${Math.max(interval.width, 20)}px`,
                backgroundColor: color,
                borderRadius: `${UI_CONSTANTS.INTERVAL_BORDER_RADIUS}px`,
                filter: isSelected
                  ? 'brightness(1.2) drop-shadow(0 0 4px rgba(255,255,255,0.8))'
                  : 'none',
              }}
              onMouseDown={e => handleIntervalMouseDown(e, interval)}
              onClick={e => {
                e.stopPropagation()
                onIntervalSelect(interval.id)
              }}
              onDoubleClick={() => handleIntervalDoubleClick(interval)}>
              {/* Interval Label */}
              <div className="px-2 py-1 text-xs text-white truncate">
                {interval.metadata?.label || 'Interval'}
              </div>

              {/* Resize handles for grid view */}
              {(isHovered || isSelected) && renderGridResizeHandles(interval)}
            </div>
          )
        })}

        {/* Enhanced Interaction Marquee */}
        {interactionMarquee && (
          <>
            {/* Marquee Background */}
            <div
              className={`absolute top-8 bottom-2 border-2 transition-all ${
                interactionMarquee.mode === 'creating'
                  ? interactionMarquee.isValid
                    ? 'bg-blue-500 bg-opacity-20 border-blue-500'
                    : 'bg-red-500 bg-opacity-20 border-red-500'
                  : interactionMarquee.mode === 'resizing'
                  ? 'bg-purple-500 bg-opacity-20 border-purple-500'
                  : 'bg-transparent border-green-500 border-dashed'
              }`}
              style={{
                left: `${interactionMarquee.left}px`,
                width: `${Math.max(interactionMarquee.width, 2)}px`,
              }}
            />

            {/* Marquee Handles */}
            <div
              className={`absolute top-8 bottom-2 w-1 ${
                interactionMarquee.mode === 'creating'
                  ? 'bg-blue-500'
                  : interactionMarquee.mode === 'resizing'
                  ? 'bg-purple-500'
                  : 'bg-green-500'
              }`}
              style={{
                left: `${interactionMarquee.left}px`,
              }}
            />
            <div
              className={`absolute top-8 bottom-2 w-1 ${
                interactionMarquee.mode === 'creating'
                  ? 'bg-blue-500'
                  : interactionMarquee.mode === 'resizing'
                  ? 'bg-purple-500'
                  : 'bg-green-500'
              }`}
              style={{
                left: `${interactionMarquee.left + interactionMarquee.width}px`,
              }}
            />

            {/* Mode Label */}
            {isDragging && (
              <div
                className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full px-2 py-1 text-xs text-white rounded whitespace-nowrap ${
                  interactionMarquee.mode === 'creating'
                    ? 'bg-blue-600'
                    : interactionMarquee.mode === 'resizing'
                    ? 'bg-purple-600'
                    : 'bg-green-600'
                }`}
                style={{
                  left: `${
                    interactionMarquee.left + interactionMarquee.width / 2
                  }px`,
                }}>
                {interactionMarquee.mode === 'creating'
                  ? 'Creating'
                  : interactionMarquee.mode === 'resizing'
                  ? 'Resizing'
                  : 'Selecting'}
                {interactionMarquee.mode === 'creating' && (
                  <span className="ml-1">
                    ({Math.round((interactionEnd! - interactionStart!) / 1000)}
                    s)
                  </span>
                )}
              </div>
            )}
          </>
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
          {interactionMode !== 'none' && (
            <span
              className={`${
                interactionMode === 'creating'
                  ? 'text-blue-600'
                  : interactionMode === 'resizing'
                  ? 'text-purple-600'
                  : 'text-green-600'
              }`}>
              Mode:{' '}
              {interactionMode === 'creating'
                ? 'Creating'
                : interactionMode === 'resizing'
                ? 'Resizing'
                : 'Selecting'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
