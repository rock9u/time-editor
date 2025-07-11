import { DateTime } from 'luxon'
import type {
  TimelineInterval,
  GridSettings,
  TimelineBounds,
  GridIntervalUnit,
} from '../types/timeline'
import { TIMELINE_CONSTANTS, MOUSE_CONSTANTS } from '../lib/constants'

/**
 * Convert timestamp to pixel position
 */
export function timestampToPixels(
  timestamp: number,
  minDate: number,
  pixelsPerMs: number
): number {
  return (timestamp - minDate) * pixelsPerMs
}

/**
 * Convert pixel position to timestamp
 */
export function pixelsToTimestamp(
  pixels: number,
  minDate: number,
  pixelsPerMs: number
): number {
  return minDate + pixels / pixelsPerMs
}

/**
 * Snap timestamp to grid
 */
export function snapToGrid(
  timestamp: number,
  gridSettings: GridSettings
): number {
  const dateTime = DateTime.fromMillis(timestamp)
  const snappedDateTime = dateTime.startOf(gridSettings.unit)
  return snappedDateTime.toMillis()
}

/**
 * Calculate pixels per millisecond based on grid settings
 */
export function calculatePixelsPerMs(
  gridSettings: GridSettings,
  pixelsPerGridUnit: number
): number {
  const msPerGridUnit = getMillisecondsPerGridUnit(gridSettings)
  return pixelsPerGridUnit / msPerGridUnit
}

/**
 * Get milliseconds for one grid unit
 */
export function getMillisecondsPerGridUnit(gridSettings: GridSettings): number {
  const { unit, value } = gridSettings

  switch (unit) {
    case 'day':
      return value * 24 * 60 * 60 * 1000
    case 'month':
      // Approximate - months vary in length
      return value * 30 * 24 * 60 * 60 * 1000
    case 'year':
      return value * 365 * 24 * 60 * 60 * 1000
    default:
      return 24 * 60 * 60 * 1000 // Default to 1 day
  }
}

/**
 * Validate timeline bounds
 */
export function validateTimelineBounds(bounds: TimelineBounds): boolean {
  return bounds.minDate < bounds.maxDate
}

/**
 * Check if two intervals overlap
 */
export function intervalsOverlap(
  interval1: TimelineInterval,
  interval2: TimelineInterval
): boolean {
  return (
    interval1.startTime < interval2.endTime &&
    interval1.endTime > interval2.startTime
  )
}

/**
 * Check if an interval is within bounds
 */
export function isIntervalInBounds(
  interval: TimelineInterval,
  bounds: TimelineBounds
): boolean {
  return (
    interval.startTime >= bounds.minDate && interval.endTime <= bounds.maxDate
  )
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(
  timestamp: number,
  format: string = 'yyyy-MM-dd HH:mm'
): string {
  return DateTime.fromMillis(timestamp).toFormat(format)
}

/**
 * Get duration text between two timestamps
 */
export function getDurationText(startTime: number, endTime: number): string {
  const duration = endTime - startTime
  const hours = Math.floor(duration / (1000 * 60 * 60))
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((duration % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

/**
 * Format grid line label based on grid unit and date
 */
export function formatGridLineLabel(
  date: DateTime,
  gridUnit: GridIntervalUnit
): string {
  switch (gridUnit) {
    case 'day':
      return date.toFormat('MMM dd')
    case 'month':
      return date.toFormat('MMM yyyy')
    case 'year':
      return date.toFormat('yyyy')
    default:
      return date.toFormat('yyyy-MM-dd')
  }
}

/**
 * Check if a grid line should be major based on grid unit and date
 */
export function isMajorGridLine(
  date: DateTime,
  gridUnit: GridIntervalUnit
): boolean {
  switch (gridUnit) {
    case 'day':
      return date.day === 1 // Start of month
    case 'month':
      return date.month === 1 // Start of year
    case 'year':
      return true // All year lines are major
    default:
      return false
  }
}

/**
 * Get the appropriate grid line styling based on importance
 */
export function getGridLineStyles(isMajor: boolean) {
  return {
    borderClass: isMajor
      ? 'border-l-2 border-gray-300'
      : 'border-l border-gray-100',
    labelClass: isMajor
      ? 'text-gray-700 bg-white font-medium'
      : 'text-gray-500 bg-gray-50',
  }
}

/**
 * Check if a new interval would overlap with any existing intervals
 */
export function wouldOverlapWithExisting(
  newInterval: { startTime: number; endTime: number },
  existingIntervals: TimelineInterval[]
): boolean {
  return existingIntervals.some(existing =>
    intervalsOverlap(
      {
        id: 'temp',
        startTime: newInterval.startTime,
        endTime: newInterval.endTime,
      },
      existing
    )
  )
}

/**
 * Get overlapping intervals for a given interval
 */
export function getOverlappingIntervals(
  interval: TimelineInterval,
  allIntervals: TimelineInterval[]
): TimelineInterval[] {
  return allIntervals.filter(
    existing =>
      existing.id !== interval.id && intervalsOverlap(interval, existing)
  )
}

/**
 * Calculate the visual feedback for interval creation
 */
export function calculateCreationMarquee(
  startTime: number,
  endTime: number,
  timelineBounds: TimelineBounds,
  pixelsPerMs: number
): {
  left: number
  width: number
  isValid: boolean
} {
  const startLeft = timestampToPixels(
    startTime,
    timelineBounds.minDate,
    pixelsPerMs
  )
  const endLeft = timestampToPixels(
    endTime,
    timelineBounds.minDate,
    pixelsPerMs
  )

  return {
    left: Math.min(startLeft, endLeft),
    width: Math.abs(endLeft - startLeft),
    isValid: endTime - startTime >= TIMELINE_CONSTANTS.MIN_INTERVAL_DURATION,
  }
}

/**
 * Check if a drag operation is valid
 */
export function isValidDrag(
  startX: number,
  currentX: number,
  threshold: number = MOUSE_CONSTANTS.DRAG_THRESHOLD
): boolean {
  return Math.abs(currentX - startX) > threshold
}

/**
 * Get the duration text for creation feedback
 */
export function getCreationDurationText(
  startTime: number,
  endTime: number
): string {
  const duration = Math.abs(endTime - startTime)

  if (duration < 1000) {
    return `${duration}ms`
  } else if (duration < 60000) {
    return `${Math.round(duration / 1000)}s`
  } else if (duration < 3600000) {
    return `${Math.round(duration / 60000)}m`
  } else {
    return `${Math.round(duration / 3600000)}h`
  }
}
