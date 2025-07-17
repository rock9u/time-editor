import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'
import { useTimeline } from '../../contexts/TimelineContext'
import {
  DEFAULT_METADATA,
  DEFAULT_TIMELINE_BOUNDS,
  INTERVAL_COLORS,
  TIMELINE_BEHAVIOR,
  TIMELINE_VIEW_MODES,
  UI_CONSTANTS,
} from '../../lib/constants'
import {
  matchesShortcut,
  getPlatform,
  getPlatformShortcuts,
} from '../../lib/constants/keyboard-shortcuts'
import { formatTimestamp, getDurationText } from '../../lib/timeline-utils'
import { createIntervalV2 } from '../../lib/timeline-utils-v2'
import { generateUUID } from '../../lib/utils'
import type {
  GridIntervalUnit,
  GridSettings,
  TimelineBounds,
  TimelineInterval,
} from '../../types/timeline'
import { GridSettingsPanel } from './GridSettingsPanel'
import { IntervalEditDialog } from './IntervalEditDialog'
import { IntervalGrid } from './IntervalGrid'
import { TimelineContextMenu } from './TimelineContextMenu'
import { TimelineToolbar } from './TimelineToolbar'

export function TimelineEditor() {
  const {
    state,
    addInterval,
    updateInterval,
    deleteInterval,
    selectInterval,
    clearSelection,
    setGridSettings,
    copyIntervals,
    selectMultipleIntervals,
  } = useTimeline()

  const { intervals, selectedIntervalIds, gridSettings, clipboard } = state

  // Grid settings state
  const [timelineBounds] = useState<TimelineBounds>(DEFAULT_TIMELINE_BOUNDS)

  // Overlap prevention state
  const [preventOverlap, setPreventOverlap] = useState<boolean>(
    TIMELINE_BEHAVIOR.PREVENT_OVERLAP
  )

  // View mode state
  const [viewMode, setViewMode] = useState<'grid' | 'badge'>(
    TIMELINE_VIEW_MODES.GRID
  )

  // Dialog state
  const [editingInterval, setEditingInterval] =
    useState<TimelineInterval | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isGridSettingsOpen, setIsGridSettingsOpen] = useState(false)

  // Debug state
  const [debugInfo, setDebugInfo] = useState<{
    lastKeyEvent: string
    platform: string
    shortcuts: Record<string, string>
    activeElement: string
    eventDetails: {
      key: string
      code: string
      metaKey: boolean
      ctrlKey: boolean
      shiftKey: boolean
      altKey: boolean
    }
  } | null>(null)
  const [isDebugExpanded, setIsDebugExpanded] = useState(false)

  // Copy functionality
  const handleCopy = useCallback(() => {
    const selectedIntervals = state.intervals.filter(interval =>
      selectedIntervalIds.has(interval.id)
    )
    copyIntervals(selectedIntervals.map(interval => interval.id))
  }, [state.intervals, copyIntervals, selectedIntervalIds])

  // Paste functionality
  const handlePaste = useCallback(
    (targetIds: Set<string>) => {
      const maxSelectedIntervalEndTime = Math.max(
        ...state.intervals
          .filter(interval => targetIds.has(interval.id))
          .map(interval => interval.endTime)
      )
      const minSelectedIntervalStartTime = Math.min(
        ...state.intervals
          .filter(interval => targetIds.has(interval.id))
          .map(interval => interval.startTime)
      )

      state.intervals
        .filter(interval => targetIds.has(interval.id))
        .forEach(interval => {
          const newInterval = {
            ...interval,
            id: generateUUID(),
            startTime: DateTime.fromMillis(maxSelectedIntervalEndTime)
              .plus({
                milliseconds: interval.startTime - minSelectedIntervalStartTime,
              })
              .toMillis(),
            gridUnit: interval.gridUnit,
            gridAmount: interval.gridAmount,
          }
          addInterval(newInterval)
        })
    },
    [state.intervals, addInterval]
  )

  const handlePasteClipboard = useCallback(() => {
    if (clipboard.length === 0) return

    handlePaste(new Set(clipboard.map(interval => interval.id)))

    copyIntervals([])
  }, [clipboard, handlePaste, copyIntervals])

  // Duplicate functionality
  const handleDuplicate = useCallback(() => {
    if (selectedIntervalIds.size === 0) return
    handlePaste(selectedIntervalIds)
  }, [selectedIntervalIds, handlePaste])

  const handleMultiply = useCallback(
    (factor: number) => {
      const selectedIntervals = state.intervals.filter(interval =>
        selectedIntervalIds.has(interval.id)
      )
      if (selectedIntervals.length === 0) return

      // Find the overall time span of selected intervals
      const minStartTime = Math.min(...selectedIntervals.map(i => i.startTime))

      // Double the duration of each interval
      selectedIntervals.forEach(interval => {
        const newStartTime =
          minStartTime + (interval.startTime - minStartTime) * factor

        updateInterval(interval.id, {
          startTime: newStartTime,
          gridAmount: interval.gridAmount * factor,
          gridUnit: interval.gridUnit,
        })
      })
    },
    [selectedIntervalIds, updateInterval, state.intervals]
  )

  // Double functionality
  const handleDouble = useCallback(() => {
    handleMultiply(2)
  }, [handleMultiply])

  // Half functionality
  const handleHalf = useCallback(() => {
    handleMultiply(0.5)
  }, [handleMultiply])

  // Delete functionality
  const handleDelete = useCallback(() => {
    selectedIntervalIds.forEach(id => deleteInterval(id))
  }, [selectedIntervalIds, deleteInterval])

  // Enhanced keyboard shortcuts using dynamic parsing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Update debug info for all keydown events
      const platform = getPlatform()
      const shortcuts = getPlatformShortcuts()

      // Build combo string for debug
      const modifiers = []
      if (e.metaKey) modifiers.push('Meta')
      if (e.ctrlKey) modifiers.push('Ctrl')
      if (e.shiftKey) modifiers.push('Shift')
      if (e.altKey) modifiers.push('Alt')

      const comboString =
        modifiers.length > 0 ? `${modifiers.join('+')}+${e.key}` : e.key

      setDebugInfo({
        lastKeyEvent: `${comboString} (${e.code})`,
        platform,
        shortcuts,
        activeElement: document.activeElement?.tagName || 'none',
        eventDetails: {
          key: e.key,
          code: e.code,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        },
      })

      // Only handle shortcuts if no input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      // Use dynamic shortcut matching
      console.log('Checking shortcuts for:', comboString)

      if (matchesShortcut(e, 'COPY')) {
        console.log('COPY shortcut matched!')
        e.preventDefault()
        handleCopy()
      } else if (matchesShortcut(e, 'PASTE')) {
        console.log('PASTE shortcut matched!')
        e.preventDefault()
        handlePasteClipboard()
      } else if (matchesShortcut(e, 'DUPLICATE')) {
        console.log('DUPLICATE shortcut matched!')
        e.preventDefault()
        handleDuplicate()
      } else if (matchesShortcut(e, 'HALF')) {
        console.log('HALF shortcut matched!')
        e.preventDefault()
        handleHalf()
      } else if (matchesShortcut(e, 'DOUBLE')) {
        console.log('DOUBLE shortcut matched!')
        e.preventDefault()
        handleDouble()
      } else if (matchesShortcut(e, 'DELETE')) {
        console.log('DELETE shortcut matched!')
        e.preventDefault()
        handleDelete()
      } else if (matchesShortcut(e, 'CLEAR_SELECTION')) {
        console.log('CLEAR_SELECTION shortcut matched!')
        e.preventDefault()
        clearSelection()
      } else if (matchesShortcut(e, 'GRID_SETTINGS')) {
        console.log('GRID_SETTINGS shortcut matched!')
        e.preventDefault()
        setIsGridSettingsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    handleCopy,
    handlePasteClipboard,
    handleDuplicate,
    handleHalf,
    handleDouble,
    handleDelete,
    clearSelection,
  ])

  const handleAddTestInterval = () => {
    const testMonth = DateTime.now().startOf('month').plus({
      months: intervals.length,
    })
    const colorIndex = intervals.length % INTERVAL_COLORS.length
    const newInterval = {
      id: generateUUID(),
      startTime: testMonth.toMillis(),
      endTime: testMonth.plus({ months: 1 }).toMillis(),
      metadata: {
        label: `${DEFAULT_METADATA.LABEL} ${intervals.length + 1}`,
        color: INTERVAL_COLORS[colorIndex],
        description: `This is a test interval created at ${testMonth.toISODate()}`,
        tags: ['test', 'demo'],
      },
    }
    addInterval({
      ...newInterval,
      gridUnit: 'month',
      gridAmount: 1,
    })
  }

  const handleIntervalCreate = (startTime: number, endTime: number) => {
    const colorIndex = intervals.length % INTERVAL_COLORS.length
    const duration = endTime - startTime

    // Calculate grid amount based on duration and current grid settings
    let gridAmount = 1
    const startDateTime = DateTime.fromMillis(startTime)
    const endDateTime = DateTime.fromMillis(endTime)
    const startYear = DateTime.fromMillis(startTime)
    const endYear = DateTime.fromMillis(endTime)
    switch (gridSettings.unit) {
      case 'day':
        gridAmount = Math.round(duration / (24 * 60 * 60 * 1000))
        break
      case 'month':
        gridAmount = Math.round(
          endDateTime.diff(startDateTime, 'months').months
        )
        break
      case 'year':
        gridAmount = Math.round(endYear.diff(startYear, 'years').years)
        break
    }

    const newInterval = createIntervalV2(
      startTime,
      gridSettings.unit,
      Math.max(1, gridAmount),
      {
        label: `New Interval ${intervals.length + 1}`,
        color: INTERVAL_COLORS[colorIndex],
        description: `Created from ${formatTimestamp(
          startTime
        )} to ${formatTimestamp(endTime)}`,
        tags: ['created'],
      }
    )

    addInterval(newInterval)
  }

  const handleIntervalSelectRange = (startTime: number, endTime: number) => {
    // Find intervals that overlap with the selection range
    const overlappingIntervals = intervals.filter(interval => {
      const intervalStart = Math.max(interval.startTime, startTime)
      const intervalEnd = Math.min(interval.endTime, endTime)
      return intervalStart < intervalEnd
    })

    // Select all overlapping intervals
    const intervalIds = overlappingIntervals.map(interval => interval.id)
    selectMultipleIntervals(intervalIds)
  }

  const handleIntervalEdit = (interval: TimelineInterval) => {
    setEditingInterval(interval)
    setIsEditDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false)
    setEditingInterval(null)
  }

  const handleEditDialogSave = (
    id: string,
    updates: Partial<TimelineInterval>
  ) => {
    updateInterval(id, updates)
  }

  const handleGridSettingsChange = (newSettings: GridSettings) => {
    setGridSettings(newSettings)
  }

  return (
    <div>
      {/* Debug Panel */}
      {debugInfo && (
        <div
          className={`fixed top-4 right-4 bg-background bg-opacity-80 text-foreground rounded-lg text-sm font-mono z-50 
            transition-transform duration-150 ease-in-out
            border border-foreground/10 p-2 
            ${
              isDebugExpanded
                ? 'max-w-md '
                : 'max-w-fit rotate-90 translate-x-1/2 translate-y-full'
            }`}>
          <div className="flex items-center justify-between">
            <div className="font-bold text-foreground">Keyboard Debug</div>
            <button
              onClick={() => setIsDebugExpanded(!isDebugExpanded)}
              className="ml-2 text-foreground hover:text-foreground transition-colors">
              {isDebugExpanded ? '−' : '+'}
            </button>
          </div>

          {isDebugExpanded && (
            <div className="mt-2">
              <div>
                <strong>Last Key:</strong> {debugInfo.lastKeyEvent}
              </div>
              <div>
                <strong>Platform:</strong> {debugInfo.platform}
              </div>
              <div>
                <strong>Active Element:</strong> {debugInfo.activeElement}
              </div>
              <div>
                <strong>Event Details:</strong>
              </div>
              <div className="ml-4 text-xs">
                <div>key: {debugInfo.eventDetails.key}</div>
                <div>code: {debugInfo.eventDetails.code}</div>
                <div>
                  metaKey: {debugInfo.eventDetails.metaKey ? 'true' : 'false'}
                </div>
                <div>
                  ctrlKey: {debugInfo.eventDetails.ctrlKey ? 'true' : 'false'}
                </div>
                <div>
                  shiftKey: {debugInfo.eventDetails.shiftKey ? 'true' : 'false'}
                </div>
                <div>
                  altKey: {debugInfo.eventDetails.altKey ? 'true' : 'false'}
                </div>
              </div>
              <div>
                <strong>Shortcuts:</strong>
              </div>
              <div className="ml-4 text-xs">
                <div>COPY: {debugInfo.shortcuts.COPY}</div>
                <div>PASTE: {debugInfo.shortcuts.PASTE}</div>
                <div>DUPLICATE: {debugInfo.shortcuts.DUPLICATE}</div>
                <div>HALF: {debugInfo.shortcuts.HALF}</div>
                <div>DOUBLE: {debugInfo.shortcuts.DOUBLE}</div>
                <div>DELETE: {debugInfo.shortcuts.DELETE}</div>
                <div>
                  CLEAR_SELECTION: {debugInfo.shortcuts.CLEAR_SELECTION}
                </div>
                <div>GRID_SETTINGS: {debugInfo.shortcuts.GRID_SETTINGS}</div>
              </div>
            </div>
          )}
        </div>
      )}
      <TimelineContextMenu
        onOpenGridSettings={() => setIsGridSettingsOpen(true)}>
        {/* Grid Settings */}
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold mb-2">Grid Settings</h2>

          <div className="flex gap-4 justify-between">
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label>Grid Value:</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={gridSettings.value}
                  onChange={e =>
                    setGridSettings({
                      ...gridSettings,
                      value: parseInt(e.target.value),
                    })
                  }
                  className="ml-2 px-2 py-1 text-sm border rounded w-16"
                />
                <Select
                  value={gridSettings.unit}
                  onValueChange={value =>
                    setGridSettings({
                      ...gridSettings,
                      unit: value as GridIntervalUnit,
                    })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="day">Day(s)</SelectItem>
                      <SelectItem value="month">Month(s)</SelectItem>
                      <SelectItem value="year">Year(s)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label>View Mode:</Label>
                <Select
                  value={viewMode}
                  onValueChange={value =>
                    setViewMode(value as 'grid' | 'badge')
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select View Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="badge">Badge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="flex items-center gap-2">
                <Switch
                  checked={preventOverlap}
                  onCheckedChange={setPreventOverlap}
                />
                <Label>Prevent Overlap</Label>
              </span>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <Button onClick={() => handleAddTestInterval()} variant="outline">
                Add Test Interval
              </Button>
              <Button onClick={clearSelection} variant="outline">
                Clear Selection
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                Delete Selected ({selectedIntervalIds.size})
              </Button>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">
              Timeline{' '}
              {viewMode === TIMELINE_VIEW_MODES.BADGE ? 'Badge' : 'Grid'} View
            </h3>
            <div className="overflow-x-auto">
              <IntervalGrid
                intervals={intervals}
                selectedIntervalIds={selectedIntervalIds}
                gridSettings={gridSettings}
                timelineBounds={timelineBounds}
                onIntervalSelect={selectInterval}
                onIntervalCreate={handleIntervalCreate}
                onIntervalUpdate={updateInterval}
                onIntervalSelectRange={handleIntervalSelectRange}
                onIntervalEdit={handleIntervalEdit}
                preventOverlap={preventOverlap}
                viewMode={viewMode}
                className="min-w-full"
              />
            </div>
          </div>

          {/* Intervals List */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Intervals ({intervals.length})
            </h3>
            {intervals.map(interval => (
              <div
                key={interval.id}
                className={`p-3 border rounded cursor-pointer ${
                  selectedIntervalIds.has(interval.id)
                    ? 'border-blue-500 bg-background'
                    : 'border-gray-300'
                }`}
                style={{
                  borderRadius: `${UI_CONSTANTS.INTERVAL_BORDER_RADIUS}px`,
                  minHeight: `${UI_CONSTANTS.INTERVAL_HEIGHT}px`,
                }}
                onClick={() => selectInterval(interval.id)}>
                <div className="flex items-center gap-2">
                  {interval.metadata?.color && (
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: interval.metadata.color }}
                    />
                  )}
                  <div className="font-medium">
                    {interval.metadata?.label || DEFAULT_METADATA.LABEL}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatTimestamp(interval.startTime)} -{' '}
                  {formatTimestamp(interval.endTime)}
                </div>
                <div className="text-xs text-gray-500">
                  Duration:{' '}
                  {getDurationText(interval.startTime, interval.endTime)}
                </div>
                {interval.metadata?.tags &&
                  interval.metadata.tags.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {interval.metadata.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-background text-foreground rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            {/* Selected Intervals */}
            {selectedIntervalIds.size > 0 && (
              <div className="mt-4 p-3 bg-background rounded">
                <h4 className="font-semibold">Selected Intervals:</h4>
                <ul className="mt-2 space-y-1">
                  {state.intervals
                    .filter(interval => selectedIntervalIds.has(interval.id))
                    .map(interval => (
                      <li key={interval.id} className="text-sm">
                        {interval.metadata?.label || DEFAULT_METADATA.LABEL}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {clipboard.length > 0 && (
              <div className="mt-4 p-3 bg-background rounded">
                <h4 className="font-semibold">Clipboard:</h4>
                <ul className="mt-2 space-y-1">
                  {state.intervals
                    .filter(interval => selectedIntervalIds.has(interval.id))
                    .map(interval => (
                      <li key={interval.id} className="text-sm">
                        {interval.metadata?.label || DEFAULT_METADATA.LABEL}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          {/* Edit Dialog */}
          <IntervalEditDialog
            interval={editingInterval}
            isOpen={isEditDialogOpen}
            onClose={handleEditDialogClose}
            onSave={handleEditDialogSave}
          />

          {/* Floating Toolbar */}
          <TimelineToolbar onClearSelection={clearSelection} />

          {/* Grid Settings Panel */}
          <GridSettingsPanel
            isOpen={isGridSettingsOpen}
            onClose={() => setIsGridSettingsOpen(false)}
            gridSettings={gridSettings}
            onGridSettingsChange={handleGridSettingsChange}
          />
        </div>
      </TimelineContextMenu>
    </div>
  )
}
