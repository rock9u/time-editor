import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateTime } from 'luxon'
import { useState } from 'react'
import { validateGridSettings } from '../../lib/timeline-utils'
import type { GridIntervalUnit, GridSettings, TimelineBounds } from '../../types/timeline'

interface GridSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  gridSettings: GridSettings
  onGridSettingsChange: (settings: GridSettings) => void
  timelineBounds: TimelineBounds
  onTimelineBoundsChange: (bounds: TimelineBounds) => void
}

const GRID_UNIT_LABELS: Record<GridIntervalUnit, string> = {
  day: 'Day(s)',
  month: 'Month(s)',
  year: 'Year(s)',
}

const GRID_UNIT_VALUES: Record<GridIntervalUnit, number[]> = {
  day: [1, 7, 14, 30, 90, 180, 365],
  month: [1, 3, 6, 12],
  year: [1, 2, 5, 10],
}

export function GridSettingsPanel({
  isOpen,
  onClose,
  gridSettings,
  onGridSettingsChange,
  timelineBounds,
  onTimelineBoundsChange,
}: GridSettingsPanelProps) {
  const [tempSettings, setTempSettings] = useState<GridSettings>(gridSettings)
  const [tempBounds, setTempBounds] = useState<TimelineBounds>(timelineBounds)
  const [isValid, setIsValid] = useState(true)

  const handleSave = () => {
    if (validateGridSettings(tempSettings) && tempBounds.minDate < tempBounds.maxDate) {
      onGridSettingsChange(tempSettings)
      onTimelineBoundsChange(tempBounds)
      onClose()
    } else {
      setIsValid(false)
    }
  }

  const handleCancel = () => {
    setTempSettings(gridSettings)
    setTempBounds(timelineBounds)
    setIsValid(true)
    onClose()
  }

  const handleUnitChange = (unit: GridIntervalUnit) => {
    const newSettings = {
      unit,
      value: GRID_UNIT_VALUES[unit][0], // Reset to first value for new unit
    }
    setTempSettings(newSettings)
    setIsValid(validateGridSettings(newSettings))
  }

  const handleValueChange = (value: string) => {
    const newSettings = {
      ...tempSettings,
      value: parseInt(value),
    }
    setTempSettings(newSettings)
    setIsValid(validateGridSettings(newSettings))
  }

  const handleStartDateChange = (value: string) => {
    const startDate = DateTime.fromFormat(value, 'yyyy-MM-dd')
    if (startDate.isValid) {
      const newBounds = {
        ...tempBounds,
        minDate: startDate.startOf('day').toMillis(),
      }
      setTempBounds(newBounds)
      setIsValid(validateGridSettings(tempSettings) && newBounds.minDate < newBounds.maxDate)
    }
  }

  const handleEndDateChange = (value: string) => {
    const endDate = DateTime.fromFormat(value, 'yyyy-MM-dd')
    if (endDate.isValid) {
      const newBounds = {
        ...tempBounds,
        maxDate: endDate.endOf('day').toMillis(),
      }
      setTempBounds(newBounds)
      setIsValid(validateGridSettings(tempSettings) && newBounds.minDate < newBounds.maxDate)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grid Settings & Timeline Bounds</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grid-unit" className="text-right">
              Unit
            </Label>
            <Select value={tempSettings.unit} onValueChange={handleUnitChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GRID_UNIT_LABELS).map(([unit, label]) => (
                  <SelectItem key={unit} value={unit}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grid-value" className="text-right">
              Value
            </Label>
            <Select
              value={tempSettings.value.toString()}
              onValueChange={handleValueChange}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRID_UNIT_VALUES[tempSettings.unit].map(value => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeline Bounds */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-date" className="text-right">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={DateTime.fromMillis(tempBounds.minDate).toFormat('yyyy-MM-dd')}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-date" className="text-right">
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={DateTime.fromMillis(tempBounds.maxDate).toFormat('yyyy-MM-dd')}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="col-span-3"
            />
          </div>

          {/* Validation Error */}
          {!isValid && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              <p className="font-medium">Invalid Settings:</p>
              <p className="text-xs">
                Please select a valid combination of unit and value, and ensure the start date is before the end date.
              </p>
            </div>
          )}

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">Current Settings:</p>
            <p>
              Grid interval: {tempSettings.value}{' '}
              {GRID_UNIT_LABELS[tempSettings.unit]}
            </p>
            <p>
              Timeline: {DateTime.fromMillis(tempBounds.minDate).toFormat('yyyy-MM-dd')} to{' '}
              {DateTime.fromMillis(tempBounds.maxDate).toFormat('yyyy-MM-dd')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Grid settings affect how intervals snap to the grid and how grid lines
              are displayed. Timeline bounds define the visible range of the timeline.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
