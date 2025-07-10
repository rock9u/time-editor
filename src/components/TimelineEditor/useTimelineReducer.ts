import { useReducer, useCallback } from 'react'
import type { TimelineInterval } from '../../types/timeline'

// Action types
export type TimelineAction =
  | { type: 'ADD_INTERVAL'; payload: TimelineInterval }
  | {
      type: 'UPDATE_INTERVAL'
      payload: { id: string; updates: Partial<TimelineInterval> }
    }
  | { type: 'DELETE_INTERVAL'; payload: string }
  | { type: 'SET_INTERVALS'; payload: TimelineInterval[] }
  | {
      type: 'BATCH_UPDATE_INTERVALS'
      payload: { ids: string[]; updates: Partial<TimelineInterval> }
    }
  | { type: 'SET_SELECTED_INTERVALS'; payload: string[] }
  | { type: 'CLEAR_SELECTED_INTERVALS' }

// State interface
export interface TimelineState {
  intervals: TimelineInterval[]
  selectedIntervalIds: Set<string>
}

// Initial state
const initialState: TimelineState = {
  intervals: [],
  selectedIntervalIds: new Set(),
}

// Reducer function
function timelineReducer(
  state: TimelineState,
  action: TimelineAction
): TimelineState {
  switch (action.type) {
    case 'ADD_INTERVAL':
      return {
        ...state,
        intervals: [...state.intervals, action.payload],
      }

    case 'UPDATE_INTERVAL':
      return {
        ...state,
        intervals: state.intervals.map(interval =>
          interval.id === action.payload.id
            ? { ...interval, ...action.payload.updates }
            : interval
        ),
      }

    case 'DELETE_INTERVAL':
      return {
        ...state,
        intervals: state.intervals.filter(
          interval => interval.id !== action.payload
        ),
        selectedIntervalIds: new Set(
          Array.from(state.selectedIntervalIds).filter(
            id => id !== action.payload
          )
        ),
      }

    case 'SET_INTERVALS':
      return {
        ...state,
        intervals: action.payload,
        selectedIntervalIds: new Set(), // Clear selection when setting new intervals
      }

    case 'BATCH_UPDATE_INTERVALS':
      return {
        ...state,
        intervals: state.intervals.map(interval =>
          action.payload.ids.includes(interval.id)
            ? { ...interval, ...action.payload.updates }
            : interval
        ),
      }

    case 'SET_SELECTED_INTERVALS':
      return {
        ...state,
        selectedIntervalIds: new Set(action.payload),
      }

    case 'CLEAR_SELECTED_INTERVALS':
      return {
        ...state,
        selectedIntervalIds: new Set(),
      }

    default:
      return state
  }
}

// Custom hook
export function useTimelineReducer() {
  const [state, dispatch] = useReducer(timelineReducer, initialState)

  // Convenience methods
  const addInterval = useCallback((interval: TimelineInterval) => {
    dispatch({ type: 'ADD_INTERVAL', payload: interval })
  }, [])

  const updateInterval = useCallback(
    (id: string, updates: Partial<TimelineInterval>) => {
      dispatch({ type: 'UPDATE_INTERVAL', payload: { id, updates } })
    },
    []
  )

  const deleteInterval = useCallback((id: string) => {
    dispatch({ type: 'DELETE_INTERVAL', payload: id })
  }, [])

  const setIntervals = useCallback((intervals: TimelineInterval[]) => {
    dispatch({ type: 'SET_INTERVALS', payload: intervals })
  }, [])

  const batchUpdateIntervals = useCallback(
    (ids: string[], updates: Partial<TimelineInterval>) => {
      dispatch({ type: 'BATCH_UPDATE_INTERVALS', payload: { ids, updates } })
    },
    []
  )

  const setSelectedIntervals = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_SELECTED_INTERVALS', payload: ids })
  }, [])

  const clearSelectedIntervals = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_INTERVALS' })
  }, [])

  const toggleIntervalSelection = useCallback(
    (id: string) => {
      const newSelectedIds = new Set(state.selectedIntervalIds)
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id)
      } else {
        newSelectedIds.add(id)
      }
      dispatch({
        type: 'SET_SELECTED_INTERVALS',
        payload: Array.from(newSelectedIds),
      })
    },
    [state.selectedIntervalIds]
  )

  const getSelectedIntervals = useCallback(() => {
    return state.intervals.filter(interval =>
      state.selectedIntervalIds.has(interval.id)
    )
  }, [state.intervals, state.selectedIntervalIds])

  return {
    // State
    intervals: state.intervals,
    selectedIntervalIds: state.selectedIntervalIds,

    // Actions
    addInterval,
    updateInterval,
    deleteInterval,
    setIntervals,
    batchUpdateIntervals,
    setSelectedIntervals,
    clearSelectedIntervals,
    toggleIntervalSelection,
    getSelectedIntervals,

    // Raw dispatch for advanced use cases
    dispatch,
  }
}
