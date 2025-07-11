import {
  initialState,
  timelineReducer,
  type TimelineContextValue,
  type TimelineIntervalV2,
} from '@/contexts/TimelineContext'
import type { GridSettings } from '@/types/timeline'
import { DateTime } from 'luxon'
import { type ReactNode, useReducer } from 'react'

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timelineReducer, initialState)

  // Helper function to calculate end time using Luxon
  const getIntervalEndTime = (interval: TimelineIntervalV2): number => {
    const startDateTime = DateTime.fromMillis(interval.startTime)
    const endDateTime = startDateTime.plus({
      [interval.gridUnit]: interval.gridAmount,
    })
    return endDateTime.toMillis()
  }

  // Helper function to calculate duration
  const getIntervalDuration = (interval: TimelineIntervalV2): number => {
    return getIntervalEndTime(interval) - interval.startTime
  }

  // Helper function to generate UUID
  const generateUUID = (): string => {
    return crypto.randomUUID()
  }

  const addInterval = (interval: Omit<TimelineIntervalV2, 'id'>) => {
    dispatch({
      type: 'ADD_INTERVAL',
      payload: { ...interval, id: generateUUID() },
    })
  }

  const updateInterval = (id: string, updates: Partial<TimelineIntervalV2>) => {
    dispatch({
      type: 'UPDATE_INTERVAL',
      payload: { id, updates },
    })
  }

  const deleteInterval = (id: string) => {
    dispatch({ type: 'DELETE_INTERVAL', payload: id })
  }

  const selectInterval = (id: string) => {
    dispatch({
      type: 'SET_SELECTED_INTERVALS',
      payload: [id],
    })
  }

  const deselectInterval = (id: string) => {
    const newSelection = Array.from(state.selectedIntervalIds).filter(
      selectedId => selectedId !== id
    )
    dispatch({
      type: 'SET_SELECTED_INTERVALS',
      payload: newSelection,
    })
  }

  const selectMultipleIntervals = (ids: string[]) => {
    dispatch({
      type: 'SET_SELECTED_INTERVALS',
      payload: ids,
    })
  }

  const clearSelection = () => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }

  const setGridSettings = (settings: GridSettings) => {
    dispatch({ type: 'SET_GRID_SETTINGS', payload: settings })
  }

  const copyIntervals = (ids: string[]) => {
    const intervalsToCopy = state.intervals.filter(interval =>
      ids.includes(interval.id)
    )
    dispatch({ type: 'SET_CLIPBOARD', payload: intervalsToCopy })
  }

  const pasteIntervals = () => {
    if (state.clipboard.length === 0) return

    // Calculate offset to prevent perfect overlap
    const offset = getMillisecondsPerGridUnit(state.gridSettings)

    state.clipboard.forEach(clipboardInterval => {
      const newInterval = {
        ...clipboardInterval,
        id: generateUUID(),
        startTime: clipboardInterval.startTime + offset,
      }
      dispatch({ type: 'ADD_INTERVAL', payload: newInterval })
    })

    dispatch({ type: 'CLEAR_CLIPBOARD' })
  }

  const duplicateIntervals = (ids: string[]) => {
    const intervalsToDuplicate = state.intervals.filter(interval =>
      ids.includes(interval.id)
    )
    const offset = getMillisecondsPerGridUnit(state.gridSettings)

    intervalsToDuplicate.forEach(interval => {
      const newInterval = {
        ...interval,
        id: generateUUID(),
        startTime: interval.startTime + offset,
      }
      dispatch({ type: 'ADD_INTERVAL', payload: newInterval })
    })
  }

  // Copy functionality
  const handleCopy = () => {
    const selectedIntervals = state.intervals.filter(interval =>
      state.selectedIntervalIds.has(interval.id)
    )
    if (selectedIntervals.length > 0) {
      // Deep clone the selected intervals
      const clonedIntervals = selectedIntervals.map(interval => ({
        ...interval,
        id: generateUUID(), // Generate new IDs for clipboard
      }))
      dispatch({ type: 'SET_CLIPBOARD', payload: clonedIntervals })
      dispatch({ type: 'CLEAR_SELECTION' })
    }
  }

  // Paste functionality
  const handlePaste = () => {
    if (state.clipboard.length === 0) return

    // Calculate offset to prevent perfect overlap
    const offset = getMillisecondsPerGridUnit(state.gridSettings)

    state.clipboard.forEach(clipboardInterval => {
      const newInterval = {
        ...clipboardInterval,
        id: generateUUID(),
        startTime: clipboardInterval.startTime + offset,
      }
      dispatch({ type: 'ADD_INTERVAL', payload: newInterval })
    })

    dispatch({ type: 'CLEAR_CLIPBOARD' })
  }

  // Duplicate functionality
  const handleDuplicate = () => {
    const selectedIntervals = state.intervals.filter(interval =>
      state.selectedIntervalIds.has(interval.id)
    )
    if (selectedIntervals.length === 0) return

    // Calculate offset to prevent perfect overlap
    const offset = getMillisecondsPerGridUnit(state.gridSettings)

    selectedIntervals.forEach(interval => {
      const newInterval = {
        ...interval,
        id: generateUUID(),
        startTime: interval.startTime + offset,
      }
      dispatch({ type: 'ADD_INTERVAL', payload: newInterval })
    })
  }

  // Multiply functionality
  const handleMultiply = (factor: number) => {
    const selectedIntervals = state.intervals.filter(interval =>
      state.selectedIntervalIds.has(interval.id)
    )
    if (selectedIntervals.length === 0) return

    // Find the overall time span of selected intervals
    const minStartTime = Math.min(...selectedIntervals.map(i => i.startTime))

    // Apply the factor to each interval
    selectedIntervals.forEach(interval => {
      const newStartTime =
        minStartTime + (interval.startTime - minStartTime) * factor
      const newEndTime =
        minStartTime + (getIntervalEndTime(interval) - minStartTime) * factor

      // Calculate new grid amount based on the new duration
      const newDuration = newEndTime - newStartTime
      const newGridAmount = Math.max(
        1,
        Math.round(newDuration / getMillisecondsPerGridUnit(state.gridSettings))
      )

      updateInterval(interval.id, {
        startTime: newStartTime,
        gridAmount: newGridAmount,
      })
    })
  }

  // Double functionality
  const handleDouble = () => {
    handleMultiply(2)
  }

  // Half functionality
  const handleHalf = () => {
    handleMultiply(0.5)
  }

  // Delete functionality
  const handleDelete = () => {
    state.selectedIntervalIds.forEach(id => deleteInterval(id))
  }

  const moveInterval = (id: string, newStartTime: number) => {
    dispatch({ type: 'MOVE_INTERVAL', payload: { id, newStartTime } })
  }
  const resizeInterval = (id: string, newGridAmount: number) => {
    dispatch({ type: 'RESIZE_INTERVAL', payload: { id, newGridAmount } })
  }

  // Helper function to get milliseconds per grid unit
  const getMillisecondsPerGridUnit = (settings: GridSettings): number => {
    const { unit, value } = settings
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

  const value: TimelineContextValue = {
    state,
    dispatch,
    addInterval,
    updateInterval,
    deleteInterval,
    selectInterval,
    deselectInterval,
    selectMultipleIntervals,
    clearSelection,
    setGridSettings,
    copyIntervals,
    pasteIntervals,
    duplicateIntervals,
    getIntervalEndTime,
    getIntervalDuration,
    moveInterval,
    resizeInterval,
    // New handlers
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleMultiply,
    handleDouble,
    handleHalf,
    handleDelete,
    getMillisecondsPerGridUnit,
  }

  return <TimelineProvider value={value}>{children}</TimelineProvider>
}
