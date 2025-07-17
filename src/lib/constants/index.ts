import type { GridSettings, GridIntervalUnit } from '@/types/timeline'

// Default grid settings as specified in requirements
export const DEFAULT_GRID_SETTINGS: GridSettings = {
  unit: 'month',
  value: 1,
}

// Grid interval units for dropdown selection
export const GRID_INTERVAL_UNITS: GridIntervalUnit[] = ['day', 'month', 'year']

// User-friendly labels for grid units
export const GRID_UNIT_LABELS: Record<GridIntervalUnit, string> = {
  day: 'Day(s)',
  month: 'Month(s)',
  year: 'Year(s)',
}

// Timeline bounds for initial view
export const DEFAULT_TIMELINE_BOUNDS = {
  minDate: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
  maxDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
}

// Timeline constants for calculations and constraints
export const TIMELINE_CONSTANTS = {
  MIN_INTERVAL_DURATION: 1000, // 1 second minimum
  MAX_INTERVAL_DURATION: 365 * 24 * 60 * 60 * 1000, // 1 year maximum
  DEFAULT_PIXELS_PER_GRID_UNIT: 100,
  SNAP_THRESHOLD: 10, // pixels
  MIN_GRID_VALUE: 1,
  MAX_GRID_VALUE: 12, // Maximum value for grid units
} as const

// Color palette for intervals
export const INTERVAL_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#EC4899', // pink
] as const

export type IntervalColor = (typeof INTERVAL_COLORS)[number]

// Platform-aware keyboard shortcuts
export { 
  PLATFORM_SHORTCUTS,
  getPlatform,
  getPlatformShortcuts,
  matchesShortcut
} from './keyboard-shortcuts'

// Legacy keyboard shortcuts for backward compatibility
export const KEYBOARD_SHORTCUTS = {
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  DUPLICATE: 'Ctrl+D',
  HALF: 'Ctrl+[',
  DOUBLE: 'Ctrl+]',
  DELETE: 'Delete',
  CLEAR_SELECTION: 'Escape',
  GRID_SETTINGS: 'Ctrl+G',
} as const

// Enhanced mouse interaction constants
export const MOUSE_CONSTANTS = {
  DOUBLE_CLICK_DELAY: 300, // milliseconds
  DRAG_THRESHOLD: 5, // pixels
  RESIZE_HANDLE_WIDTH: 8, // pixels
  MIN_DRAG_DISTANCE: 10, // pixels
  CREATION_FEEDBACK_DELAY: 100, // milliseconds
} as const

// Creation feedback constants
export const CREATION_CONSTANTS = {
  MARQUEE_OPACITY: 0.3,
  VALID_COLOR: '#3B82F6', // blue
  INVALID_COLOR: '#EF4444', // red
  HANDLE_SIZE: 4, // pixels
  LABEL_OFFSET: 20, // pixels
} as const

// Grid calculation constants
export const GRID_CALCULATION_CONSTANTS = {
  // Approximate days per unit for calculations
  DAYS_PER_MONTH: 30,
  DAYS_PER_YEAR: 365,

  // Minimum grid unit values for validation
  MIN_DAYS: 1,
  MAX_DAYS: 365,
  MIN_MONTHS: 1,
  MAX_MONTHS: 12,
  MIN_YEARS: 1,
  MAX_YEARS: 10,
} as const

// Export/Import constants
export const EXPORT_CONSTANTS = {
  DEFAULT_FILENAME: 'timeline_intervals',
  FILE_EXTENSION: '.json',
  MIME_TYPE: 'application/json',
} as const

// UI constants
export const UI_CONSTANTS = {
  TOOLBAR_HEIGHT: 48,
  GRID_HEADER_HEIGHT: 32,
  INTERVAL_HEIGHT: 24,
  INTERVAL_BORDER_RADIUS: 4,
  SELECTION_BORDER_WIDTH: 2,
  MARQUEE_OPACITY: 0.3,
} as const

// Validation messages
export const VALIDATION_MESSAGES = {
  INVALID_INTERVAL: 'Invalid interval data',
  OVERLAPPING_INTERVALS: 'Intervals cannot overlap',
  INVALID_TIMESTAMP: 'Invalid timestamp',
  INVALID_DURATION: 'Invalid duration',
  INVALID_GRID_SETTINGS: 'Invalid grid settings',
} as const

// Default metadata values
export const DEFAULT_METADATA = {
  LABEL: 'Untitled Interval',
  DESCRIPTION: '',
  TAGS: [],
  COLOR: INTERVAL_COLORS[0],
} as const

// Grid unit specific settings
export const GRID_UNIT_SETTINGS: Record<
  GridIntervalUnit,
  {
    minValue: number
    maxValue: number
    step: number
    commonValues: number[]
  }
> = {
  day: {
    minValue: 1,
    maxValue: 365,
    step: 1,
    commonValues: [1, 7, 14, 30, 90, 180, 365],
  },
  month: {
    minValue: 1,
    maxValue: 12,
    step: 1,
    commonValues: [1, 3, 6, 12],
  },
  year: {
    minValue: 1,
    maxValue: 10,
    step: 1,
    commonValues: [1, 2, 5, 10],
  },
} as const

// Re-export all constants for easier imports
export * from '../constants'

// Additional grouped constants
export const TIMELINE_DEFAULTS = {
  GRID_SETTINGS: DEFAULT_GRID_SETTINGS,
  BOUNDS: DEFAULT_TIMELINE_BOUNDS,
  METADATA: DEFAULT_METADATA,
} as const

export const INTERACTION_CONSTANTS = {
  KEYBOARD: KEYBOARD_SHORTCUTS,
  MOUSE: MOUSE_CONSTANTS,
} as const

export const VALIDATION_CONSTANTS = {
  MESSAGES: VALIDATION_MESSAGES,
  GRID_UNITS: GRID_UNIT_SETTINGS,
} as const

// Timeline behavior constants
export const TIMELINE_BEHAVIOR = {
  PREVENT_OVERLAP: true, // Default: prevent overlapping intervals
  ALLOW_OVERLAP: false, // Allow overlapping intervals
  SNAP_TO_GRID: true, // Default: snap intervals to grid
  FREE_POSITIONING: false, // Allow free positioning
} as const

// Timeline view modes
export const TIMELINE_VIEW_MODES = {
  GRID: 'grid',
  BADGE: 'badge',
} as const

export type TimelineViewMode =
  (typeof TIMELINE_VIEW_MODES)[keyof typeof TIMELINE_VIEW_MODES]

// Badge view constants
export const BADGE_VIEW_CONSTANTS = {
  BADGE_SIZE: 12, // pixels
  CONNECTION_LINE_WIDTH: 2, // pixels
  BADGE_SPACING: 4, // pixels between badges
  HOVER_OPACITY: 1.0,
  NORMAL_OPACITY: 0.5,
  CONNECTION_OPACITY: 0.3,
} as const

// Selection styling constants
export const SELECTION_CONSTANTS = {
  RING_COLOR: 'ring-white',
  RING_OFFSET: 'ring-offset-2',
  SHADOW: 'shadow-lg',
  BRIGHTNESS: 'brightness(1.2)',
  DROP_SHADOW: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))',
  LINE_DROP_SHADOW: 'drop-shadow(0 0 2px rgba(255,255,255,0.6))',
} as const

// Resize handle constants
export const RESIZE_HANDLE_CONSTANTS = {
  WIDTH: 4, // pixels
  HEIGHT: 8, // pixels for badge view
  BORDER_RADIUS: 2, // pixels
  HOVER_OPACITY: 0.75,
  ACTIVE_OPACITY: 1.0,
  RING_COLOR: 'ring-blue-500',
  RING_OFFSET: 'ring-offset-1',
} as const
