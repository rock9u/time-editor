import { DateTime } from 'luxon'
import type {
  TimelineIntervalV2,
  GridSettings,
  GridIntervalUnit,
} from '../types/timeline'
import { snapToGrid } from '@/lib/timeline-utils'

/**
 * Calculate the end time of an interval using Luxon for accurate calendar calculations
 */
export function getIntervalEndTime(interval: TimelineIntervalV2): number {
  const startDateTime = DateTime.fromMillis(interval.startTime)
  const endDateTime = startDateTime.plus({
    [interval.gridUnit]: interval.gridAmount,
  })
  return endDateTime.toMillis()
}

/**
 * Calculate the duration of an interval in milliseconds
 */
export function getIntervalDuration(interval: TimelineIntervalV2): number {
  return getIntervalEndTime(interval) - interval.startTime
}

/**
 * Convert V2 interval to legacy format for backward compatibility
 */
export function convertToLegacyInterval(interval: TimelineIntervalV2): {
  id: string
  startTime: number
  endTime: number
  metadata?: any
} {
  return {
    id: interval.id,
    startTime: interval.startTime,
    endTime: getIntervalEndTime(interval),
    metadata: interval.metadata,
  }
}

/**
 * Convert legacy interval to V2 format
 */
export function convertToV2Interval(
  legacyInterval: {
    id: string
    startTime: number
    endTime: number
    metadata?: any
  },
  gridSettings: GridSettings
): TimelineIntervalV2 {
  const duration = legacyInterval.endTime - legacyInterval.startTime
  const startDateTime = DateTime.fromMillis(legacyInterval.startTime)
  const endDateTime = DateTime.fromMillis(legacyInterval.endTime)

  // Calculate grid amount based on the actual duration
  let gridAmount: number
  const gridUnit: GridIntervalUnit = gridSettings.unit

  switch (gridSettings.unit) {
    case 'day':
      gridAmount = Math.round(duration / (24 * 60 * 60 * 1000))
      break
    case 'month':
      gridAmount = Math.round(endDateTime.diff(startDateTime, 'months').months)
      break
    case 'year':
      gridAmount = Math.round(endDateTime.diff(startDateTime, 'years').years)
      break
    default:
      gridAmount = 1
  }

  return {
    id: legacyInterval.id,
    startTime: legacyInterval.startTime,
    gridUnit: gridUnit,
    gridAmount: Math.max(1, gridAmount),
    metadata: legacyInterval.metadata,
  }
}

/**
 * Check if two V2 intervals overlap
 */
export function intervalsOverlapV2(
  interval1: TimelineIntervalV2,
  interval2: TimelineIntervalV2
): boolean {
  const end1 = getIntervalEndTime(interval1)
  const end2 = getIntervalEndTime(interval2)

  return interval1.startTime < end2 && end1 > interval2.startTime
}

/**
 * Move an interval to a new start time while maintaining its grid structure
 */
export function moveIntervalV2(
  interval: TimelineIntervalV2,
  newStartTime: number,
  gridSettings: GridSettings
): TimelineIntervalV2 {
  // Snap the new start time to the grid
  const snappedStartTime = snapToGrid(newStartTime, gridSettings)

  return {
    ...interval,
    startTime: snappedStartTime.toMillis(),
    gridUnit: gridSettings.unit,
    gridAmount: snappedStartTime.gridAmount,
  }
}

/**
 * Resize an interval by changing its grid amount
 */
export function resizeIntervalV2(
  interval: TimelineIntervalV2,
  newGridAmount: number
): TimelineIntervalV2 {
  return {
    ...interval,
    gridAmount: Math.max(1, newGridAmount),
  }
}

/**
 * Create a new interval with the new structure
 */
export function createIntervalV2(
  startTime: number,
  gridUnit: GridIntervalUnit,
  gridAmount: number,
  metadata?: any
): TimelineIntervalV2 {
  return {
    id: crypto.randomUUID(),
    startTime,
    gridUnit,
    gridAmount: Math.max(1, gridAmount),
    metadata,
  }
}

/**
 * Validate that an interval is properly structured
 */
export function validateIntervalV2(interval: TimelineIntervalV2): boolean {
  return !!(
    interval.id &&
    typeof interval.startTime === 'number' &&
    interval.startTime >= 0 &&
    ['day', 'month', 'year'].includes(interval.gridUnit) &&
    typeof interval.gridAmount === 'number' &&
    interval.gridAmount > 0
  )
}
