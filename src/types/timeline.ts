import type { GridIntervalUnit } from './timeline'

// New interval structure using start + grid + amount
export interface TimelineIntervalV2 {
  id: string
  startTime: number // Unix timestamp in milliseconds
  gridUnit: GridIntervalUnit // 'day', 'month', 'year'
  gridAmount: number // How many grid units this interval spans
  metadata?: {
    label?: string
    color?: string
    description?: string
    tags?: string[]
    [key: string]: any
  }
}

// Legacy interface for backward compatibility
export interface TimelineInterval {
  id: string
  startTime: number
  endTime: number
  metadata?: {
    label?: string
    color?: string
    description?: string
    tags?: string[]
    [key: string]: any
  }
}

export type GridIntervalUnit = 'day' | 'month' | 'year'

export interface GridSettings {
  unit: GridIntervalUnit // e.g., 'month', 'day'
  value: number // e.g., 1 (for 1 month), 30 (for 30 days)
}

// Additional types for enhanced functionality
export interface TimelineBounds {
  minDate: number // Unix timestamp in milliseconds
  maxDate: number // Unix timestamp in milliseconds
}

export interface TimelineViewport {
  startTime: number
  endTime: number
  zoomLevel: number // pixels per time unit
}

export interface IntervalSelection {
  ids: Set<string>
  type: 'single' | 'multiple' | 'region'
  regionBounds?: {
    startTime: number
    endTime: number
  }
}

// Constants for grid units
export const GRID_INTERVAL_UNITS: GridIntervalUnit[] = ['day', 'month', 'year']

export const GRID_UNIT_LABELS: Record<GridIntervalUnit, string> = {
  day: 'Day(s)',
  month: 'Month(s)',
  year: 'Year(s)',
}

// Validation functions
export function isValidTimelineInterval(
  interval: unknown
): interval is TimelineInterval {
  return (
    typeof interval === 'object' &&
    interval !== null &&
    interval !== undefined &&
    typeof (interval as Record<string, unknown>).id === 'string' &&
    typeof (interval as Record<string, unknown>).startTime === 'number' &&
    typeof (interval as Record<string, unknown>).endTime === 'number' &&
    (interval as TimelineInterval).startTime <
      (interval as TimelineInterval).endTime
  )
}

export function validateTimelineIntervals(
  intervals: unknown[]
): TimelineInterval[] {
  return intervals.filter(isValidTimelineInterval)
}
