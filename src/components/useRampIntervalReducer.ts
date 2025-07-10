import { DateTime, Duration } from 'luxon'
import { useCallback, useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'

const logger = {
  info: console.info,
  error: console.error,
  trace: console.trace,
}

type DisplayTermType = 'month' | 'year' | 'endDate' | 'evergreen'
type DisplayStartDateType = 'fixed' | 'executionDate'

const DEFAULT_TIMEZONE = 'UTC-8'
export const unixToLuxonWithTz = (
  unixTime: number | undefined | null,
  timezone?: string
) => {
  if (!unixTime)
    return DateTime.fromSeconds(0, { zone: timezone ?? DEFAULT_TIMEZONE })
  return DateTime.fromSeconds(unixTime, { zone: timezone ?? DEFAULT_TIMEZONE })
}

export function calculateOrderEndDate(
  startDate: number,
  termLength: { cycle: 'month' | 'year'; step: number }
) {
  const startDateObj = unixToLuxonWithTz(startDate)
  const termCycleUnit = termLength.cycle === 'month' ? 'month' : 'year'
  return startDateObj.plus({ [termCycleUnit]: termLength.step })
}

export function calculateRampIntervals(
  startDate: number,
  termLength: { cycle: 'month' | 'year'; step: number },
  endDate?: number | null | undefined
): number[] {
  const startDateObj = unixToLuxonWithTz(startDate)

  const intervals: number[] = []

  const endDateObj = endDate
    ? unixToLuxonWithTz(endDate)
    : calculateOrderEndDate(startDate, termLength)

  let nextInterval = startDateObj

  while (nextInterval < endDateObj) {
    intervals.push(nextInterval.toUnixInteger())
    nextInterval = nextInterval.plus({ year: 1 })
  }

  if (intervals.length === 0) {
    intervals.push(startDate)
  }

  logger.trace({ msg: 'calculating ramp intervals', intervals })

  return intervals
}
export const addOneDayToUnixDate = (unixTime: number): number => {
  if (!unixTime) {
    return DateTime.now().toUnixInteger()
  }
  return DateTime.fromSeconds(unixTime)
    .plus(Duration.fromObject({ day: 1 }))
    .toUnixInteger()
}
export const addDurationToUnixDate = (
  unixTime: number,
  duration: Duration
): number => {
  if (!unixTime) {
    return DateTime.now().toUnixInteger()
  }
  return DateTime.fromSeconds(unixTime).plus(duration).toUnixInteger()
}

export const RampIntervalSelectIds = [
  'none',
  'everyYear',
  'specifiedDate',
] as const

export type RampIntervalSelectId = (typeof RampIntervalSelectIds)[number]
export type RampSettingViewProps = {
  rampIntervalType: RampIntervalSelectId
  intervals: number[]
  intervalProps: { error?: string }[]
  startDate?: number
  endDate?: number
  disableSelect?: boolean
  termType?: 'month' | 'year' | 'evergreen'
  deleteInterval?: (index: number) => void
  addInterval?: () => void
  updateInterval?: (index: number, newInterval: number) => void
  updateIntervalType?: (value: RampIntervalSelectId) => void
  disableRamp?: boolean
  startDateType?: DisplayStartDateType
}
export function formatRampIntervalType(
  rampIntervalType?: RampIntervalSelectId
) {
  switch (rampIntervalType) {
    case 'everyYear':
      return 'Every Year'
    case 'specifiedDate':
      return 'Specified Dates'
    default:
      return 'None'
  }
}

export function useRampIntervalReducer({
  open,
  form,
  defaults,
  onChange,
}: {
  open?: boolean
  form: UseFormReturn<{
    startDateType: DisplayStartDateType
    termType: DisplayTermType
    startDate: number
    endDate: number
    duration: number
  }>
  defaults: {
    startDateType: DisplayStartDateType
    termType: DisplayTermType
    startDate: number
    endDate: number
    duration: number
    intervals: number[]
    rampIntervalType: RampIntervalSelectId
  }
  onChange?: (newValues: {
    intervals: number[]
    rampIntervalType: RampIntervalSelectId
  }) => void
}) {
  const startDateType = form.watch('startDateType')
  const termType = form.watch('termType')
  const startDate = form.watch('startDate') || 0
  const endDate = (() => {
    const duration = form.watch('duration') ?? 0
    if (termType === 'month') {
      return addDurationToUnixDate(
        startDate,
        Duration.fromObject({ months: duration })
      )
    }
    if (termType === 'year') {
      return addDurationToUnixDate(
        startDate,
        Duration.fromObject({ years: duration })
      )
    }
    if (termType === 'evergreen') {
      return addDurationToUnixDate(startDate, Duration.fromObject({ years: 5 }))
    }

    //End dates from BE are non-inclusive, so it always needs to be handled with -1 day
    return addOneDayToUnixDate(form.watch('endDate') || startDate || 0)
  })()

  const cycle = termType === 'month' ? 'month' : 'year'

  const [rampIntervalType, setRampIntervalType] =
    useState<RampIntervalSelectId>('none')
  const [intervals, setIntervals] = useState<number[]>([])

  const intervalProps = intervals.map((interval, index) => {
    const isOutOfRange =
      !!startDate && !!endDate && (interval >= endDate || interval < startDate)
    let error = isOutOfRange ? 'Interval is out of range' : ''
    if (index === 0) {
      // first interval is always disabled so no error should be shown
      error = ''
    }
    if (intervals.findIndex(_interval => interval === _interval) !== index) {
      error = 'Interval cannot be duplicated'
    }
    return {
      error,
    }
  })

  const addInterval = () => {
    const lastInterval = intervals[intervals.length - 1]
    setIntervals(intervals => {
      if (intervals.length > 0 && lastInterval !== undefined) {
        return [
          ...intervals,
          DateTime.fromSeconds(lastInterval).plus({ days: 1 }).toUnixInteger(),
        ]
      } else {
        return [startDate]
      }
    })
  }

  const updateInterval = (index: number, newInterval: number) => {
    logger.info({ index, newInterval })
    setIntervals(intervals =>
      intervals.map((interval, i) => {
        return i === index ? newInterval : interval
      })
    )
  }

  const deleteInterval = (index: number) => {
    setIntervals(intervals => intervals.filter((_, i) => i !== index))
  }

  const clearIntervals = () => {
    setIntervals([])
  }

  const [yearlyInterval, setYearlyIntervals] = useState<number[]>(
    calculateRampIntervals(
      startDate,
      { cycle: cycle ?? 'year', step: 1 },
      endDate
    )
  )

  const updateIntervalType = useCallback(
    (value: RampIntervalSelectId) => {
      setRampIntervalType(value)
      switch (value) {
        case 'everyYear':
          if (termType === 'evergreen') {
            return updateIntervalType('none')
          }
          setIntervals(yearlyInterval)
          setRampIntervalType('everyYear')
          break
        case 'specifiedDate':
          setIntervals(intervals => {
            return intervals.length === 0 ? yearlyInterval : intervals
          })
          setRampIntervalType('specifiedDate')
          break
        default:
          setRampIntervalType('none')
          clearIntervals()
          break
      }
    },
    [yearlyInterval, termType]
  )

  /**
   * SIDE EFFECTS
   */
  useEffect(() => {
    const newYearly = calculateRampIntervals(
      startDate,
      { cycle: cycle ?? 'year', step: 1 },
      endDate
    )
    setYearlyIntervals(newYearly)
    if (rampIntervalType === 'everyYear') {
      setIntervals(newYearly)
    } else if (rampIntervalType === 'specifiedDate') {
      setIntervals(prev => [startDate, ...prev.slice(1)])
    }

    // only watch for the dependencies that required by interval calculation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, cycle])

  useEffect(() => {
    onChange?.({
      rampIntervalType,
      intervals,
    })
  }, [rampIntervalType, intervals, onChange])

  useEffect(() => {
    if (termType === 'evergreen') {
      setRampIntervalType('none')
      setIntervals([])
    }
  }, [termType])

  useEffect(() => {
    if (startDateType === 'executionDate') {
      setRampIntervalType('none')
      setIntervals([])
      form.setValue('termType', 'year')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDateType])

  useEffect(() => {
    if (open) {
      form.reset({
        startDate: defaults.startDate,
        endDate: defaults.endDate,
        duration: defaults.duration,
        termType: defaults.termType,
        startDateType: defaults.startDateType,
      })
      const newYearly = calculateRampIntervals(
        defaults.startDate,
        {
          cycle: defaults.termType === 'month' ? 'month' : 'year',
          step: defaults.duration,
        },
        defaults.endDate ? addOneDayToUnixDate(defaults.endDate) : undefined
      )
      const intervalHasYearlyGap =
        newYearly.join() === defaults.intervals.join()
      const newRampIntervalType = intervalHasYearlyGap
        ? 'everyYear'
        : defaults.rampIntervalType ?? 'none'
      setRampIntervalType(newRampIntervalType)
      setIntervals(defaults.intervals ?? [])
    }
  }, [open, defaults, form])

  return {
    /**
     * VISUALS
     */
    disableRamp: !startDate || startDateType === 'executionDate',
    hasError: intervalProps.some(props => !!props.error),

    /**
     * DISPLAY VALUES
     */
    startDateType,
    termType,
    startDate,
    endDate,

    /**
     * ACTIONS
     */
    rampIntervalType,
    intervals,
    intervalProps,
    updateIntervalType,
    updateInterval,
    deleteInterval,
    addInterval,
  }
}
