import { DateTime } from 'luxon'
import type {
  TimelineInterval,
  GridSettings,
  TimelineBounds,
} from '../types/timeline'

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
 * Get duration in human readable format
 */
export function getDurationText(startTime: number, endTime: number): string {
  const duration = DateTime.fromMillis(endTime).diff(
    DateTime.fromMillis(startTime)
  )

  if (duration.as('days') >= 1) {
    return `${Math.round(duration.as('days'))} days`
  } else if (duration.as('hours') >= 1) {
    return `${Math.round(duration.as('hours'))} hours`
  } else if (duration.as('minutes') >= 1) {
    return `${Math.round(duration.as('minutes'))} minutes`
  } else {
    return `${Math.round(duration.as('seconds'))} seconds`
  }
}
