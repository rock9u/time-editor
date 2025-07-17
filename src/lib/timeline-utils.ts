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
 * Enhanced snap to grid using Luxon for accurate calendar calculations
 * This is crucial for proper grid snapping that respects calendar accuracy
 */
export function snapToGrid(
  timestamp: number,
  gridSettings: Partial<GridSettings>,
  startDate?: number
): {
  toMillis: () => number
  gridAmount: number
  unit: GridIntervalUnit
} {
  const dt = DateTime.fromMillis(timestamp)
  const { unit, value = 1 } = gridSettings

  // If no start date provided, use calendar boundaries (legacy behavior)
  if (!startDate) {
    // Use Luxon's startOf method for accurate calendar boundaries
    let snappedDateTime: DateTime

    switch (unit) {
      case 'day':
        // Start of the day, then add the specified number of days
        snappedDateTime = dt.startOf('day')
        if (value > 1) {
          // Calculate which day block we're in
          const dayOfYear = dt.ordinal
          const blockNumber = Math.floor(dayOfYear / value)
          const targetDay = blockNumber * value + 1
          snappedDateTime = DateTime.fromObject({
            year: dt.year,
            ordinal: targetDay,
          })
        }
        break

      case 'month':
        // Start of the month, then add the specified number of months
        snappedDateTime = dt.startOf('month')
        if (value > 1) {
          // Calculate which month block we're in
          const monthOfYear = dt.month
          const blockNumber = Math.floor((monthOfYear - 1) / value)
          const targetMonth = blockNumber * value + 1
          snappedDateTime = DateTime.fromObject({
            year: dt.year,
            month: targetMonth,
            day: 1,
          })
        }
        break

      case 'year':
        // Start of the year, then add the specified number of years
        snappedDateTime = dt.startOf('year')
        if (value > 1) {
          // Calculate which year block we're in
          const year = dt.year
          const blockNumber = Math.floor(year / value)
          const targetYear = blockNumber * value
          snappedDateTime = DateTime.fromObject({
            year: targetYear,
            month: 1,
            day: 1,
          })
        }
        break

      default:
        return {
          toMillis: () => timestamp,
          gridAmount: 1,
          unit: 'day',
        }
    }

    return {
      toMillis: () => snappedDateTime.toMillis(),
      gridAmount: value,
      unit: unit,
    }
  }

  // New behavior: snap relative to timeline start date
  const startDt = DateTime.fromMillis(startDate)
  const timeDiff = timestamp - startDate
  let snappedDateTime: DateTime

  switch (unit) {
    case 'day': {
      const gridSizeMs = value * 24 * 60 * 60 * 1000 // days to milliseconds
      const gridNumber = Math.floor(timeDiff / gridSizeMs)
      snappedDateTime = startDt.plus({ days: gridNumber * value })
      break
    }

    case 'month': {
      const monthsDiff = dt.diff(startDt, 'months').months
      const gridNumber = Math.floor(monthsDiff / value)
      snappedDateTime = startDt.plus({ months: gridNumber * value })
      break
    }

    case 'year': {
      const yearsDiff = dt.diff(startDt, 'years').years
      const gridNumber = Math.floor(yearsDiff / value)
      snappedDateTime = startDt.plus({ years: gridNumber * value })
      break
    }

    default:
      return {
        toMillis: () => timestamp,
        gridAmount: 1,
        unit: 'day',
      }
  }

  return {
    toMillis: () => snappedDateTime.toMillis(),
    gridAmount: value,
    unit: unit,
  }
}

/**
 * Calculate pixels per millisecond based on grid settings
 */
export function calculatePixelsPerMs(
  gridSettings: GridSettings,
  pixelsPerGridUnit: number
): number {
  const { unit, value = 1 } = gridSettings
  let millisecondsPerUnit: number
  const now = DateTime.now()
  const nextMonth = now.plus({ months: value })
  const nextYear = now.plus({ years: value })

  switch (unit) {
    case 'day':
      millisecondsPerUnit = value * 24 * 60 * 60 * 1000
      break
    case 'month':
      // Use Luxon for accurate month calculations
      millisecondsPerUnit = nextMonth.diff(now).toMillis()
      break
    case 'year':
      // Use Luxon for accurate year calculations
      millisecondsPerUnit = nextYear.diff(now).toMillis()
      break
    default:
      millisecondsPerUnit = 24 * 60 * 60 * 1000 // Default to 1 day
  }

  return pixelsPerGridUnit / millisecondsPerUnit
}

/**
 * Get milliseconds per grid unit using Luxon for accuracy
 */
export function getMillisecondsPerGridUnit(gridSettings: GridSettings): number {
  const { unit, value = 1 } = gridSettings
  const now = DateTime.now()
  const nextMonth = now.plus({ months: value })
  const nextYear = now.plus({ years: value })

  switch (unit) {
    case 'day':
      return value * 24 * 60 * 60 * 1000
    case 'month':
      return nextMonth.diff(now).toMillis()
    case 'year':
      return nextYear.diff(now).toMillis()
    default:
      return 24 * 60 * 60 * 1000
  }
}

/**
 * Generate grid lines using Luxon for accurate calendar calculations
 */
export function generateGridLines(
  timelineBounds: TimelineBounds,
  gridSettings: GridSettings,
  pixelsPerMs: number
): Array<{
  position: number
  timestamp: number
  label: string
  isMajor: boolean
}> {
  const lines: Array<{
    position: number
    timestamp: number
    label: string
    isMajor: boolean
  }> = []

  let currentDate = DateTime.fromMillis(timelineBounds.minDate)
  const endDate = DateTime.fromMillis(timelineBounds.maxDate)

  // Start from the beginning of the appropriate unit
  currentDate = currentDate.startOf(gridSettings.unit)

  while (currentDate <= endDate) {
    const timestamp = currentDate.toMillis()
    const position = timestampToPixels(
      timestamp,
      timelineBounds.minDate,
      pixelsPerMs
    )

    let isMajor = false
    let label = ''

    // Determine if this is a major grid line and create appropriate labels
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

    // Use Luxon's plus method for accurate calendar arithmetic
    currentDate = currentDate.plus({
      [gridSettings.unit]: gridSettings.value,
    })
  }

  return lines
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
export function formatTimestamp(timestamp: number): string {
  return DateTime.fromMillis(timestamp).toFormat('yyyy-MM-dd HH:mm:ss')
}

/**
 * Get duration text between two timestamps
 */
export function getDurationText(startTime: number, endTime: number): string {
  const start = DateTime.fromMillis(startTime)
  const end = DateTime.fromMillis(endTime)
  const duration = end.diff(start)

  const days = Math.floor(duration.as('days'))
  const hours = Math.floor(duration.as('hours')) % 24
  const minutes = Math.floor(duration.as('minutes')) % 60

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
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

/**
 * Validate grid settings
 */
export function validateGridSettings(gridSettings: GridSettings): boolean {
  const { unit, value = 1 } = gridSettings

  if (value < 1) return false

  switch (unit) {
    case 'day':
      return value <= 365
    case 'month':
      return value <= 12
    case 'year':
      return value <= 10
    default:
      return false
  }
}

/**
 * Get the next grid line timestamp
 */
export function getNextGridLine(
  timestamp: number,
  gridSettings: GridSettings
): number {
  const dt = DateTime.fromMillis(timestamp)
  const { unit, value = 1 } = gridSettings

  let nextDateTime: DateTime

  switch (unit) {
    case 'day':
      nextDateTime = dt.plus({ days: value })
      break
    case 'month':
      nextDateTime = dt.plus({ months: value })
      break
    case 'year':
      nextDateTime = dt.plus({ years: value })
      break
    default:
      return timestamp
  }

  return nextDateTime.toMillis()
}

/**
 * Get the previous grid line timestamp
 */
export function getPreviousGridLine(
  timestamp: number,
  gridSettings: GridSettings
): number {
  const dt = DateTime.fromMillis(timestamp)
  const { unit, value = 1 } = gridSettings

  let prevDateTime: DateTime

  switch (unit) {
    case 'day':
      prevDateTime = dt.minus({ days: value })
      break
    case 'month':
      prevDateTime = dt.minus({ months: value })
      break
    case 'year':
      prevDateTime = dt.minus({ years: value })
      break
    default:
      return timestamp
  }

  return prevDateTime.toMillis()
}

/**
 * Find the nearest grid line to a given timestamp
 * This is used to determine which grid line is closest when double-clicking
 */
export function findNearestGridLine(
  timestamp: number,
  gridSettings: GridSettings,
  timelineStartDate?: number
): number {
  const { unit, value = 1 } = gridSettings

  // Get the current grid unit boundaries
  const currentGridStart = snapToGrid(timestamp, gridSettings, timelineStartDate).toMillis()
  const currentGridEnd = DateTime.fromMillis(currentGridStart)
    .plus({ [unit]: value })
    .toMillis()

  // Calculate distances to both boundaries
  const distanceToStart = Math.abs(timestamp - currentGridStart)
  const distanceToEnd = Math.abs(timestamp - currentGridEnd)

  // Return the closer boundary
  return distanceToStart <= distanceToEnd ? currentGridStart : currentGridEnd
}
