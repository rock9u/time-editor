import type { TimelineIntervalV2 } from '../contexts/TimelineContext'

// Shared props interface for timeline components
export interface TimelineSharedProps {
  selectedIntervals: TimelineIntervalV2[]
  clipboard: TimelineIntervalV2[]
  onCopy: () => void
  onPaste: () => void
  onDuplicate: () => void
  onDelete: () => void
  onDouble: () => void
  onHalf: () => void
}

// Additional props for context menu
export interface TimelineContextMenuProps {
  children: React.ReactNode
  onOpenGridSettings: () => void
}

// Additional props for toolbar
export interface TimelineToolbarProps {
  onClearSelection: () => void
}

// Action handler functions type
export interface TimelineActionHandlers {
  handleCopy: () => void
  handlePaste: () => void
  handleDuplicate: () => void
  handleDelete: () => void
  handleDouble: () => void
  handleHalf: () => void
}