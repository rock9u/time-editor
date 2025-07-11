import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'
import type { GridSettings, GridIntervalUnit } from '../../types/timeline'

interface GridSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  gridSettings: GridSettings
  onGridSettingsChange: (settings: GridSettings) => void
}

const GRID_UNIT_LABELS: Record<GridIntervalUnit, string> = {
  day: 'Day(s)',
  month: 'Month(s)',
  year: 'Year(s)',
}

const GRID_UNIT_VALUES: Record<GridIntervalUnit, number[]> = {
  day: [1, 7, 14, 30],
  month: [1, 3, 6, 12],
  year: [1, 2, 5, 10],
}

export function GridSettingsPanel({
  isOpen,
  onClose,
  gridSettings,
  onGridSettingsChange,
}: GridSettingsPanelProps) {
  const [tempSettings, setTempSettings] = useState<GridSettings>(gridSettings)

  const handleSave = () => {
    onGridSettingsChange(tempSettings)
    onClose()
  }

  const handleCancel = () => {
    setTempSettings(gridSettings)
    onClose()
  }

  const handleUnitChange = (unit: GridIntervalUnit) => {
    setTempSettings(prev => ({
      unit,
      value: GRID_UNIT_VALUES[unit][0], // Reset to first value for new unit
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grid Settings</DialogTitle>
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
              onValueChange={value =>
                setTempSettings(prev => ({
                  ...prev,
                  value: parseInt(value),
                }))
              }>
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
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">Current Settings:</p>
            <p>
              Grid interval: {tempSettings.value}{' '}
              {GRID_UNIT_LABELS[tempSettings.unit]}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This will affect how intervals snap to the grid and how grid lines
              are displayed.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Apply Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
