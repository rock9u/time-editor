import React from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Copy,
  ClipboardList,
  CopyPlus,
  Trash2,
  RotateCcw,
  Settings,
} from 'lucide-react'
import type { TimelineInterval } from '../../types/timeline'

interface TimelineContextMenuProps {
  children: React.ReactNode
  selectedIntervals: TimelineInterval[]
  clipboard: TimelineInterval[]
  onCopy: () => void
  onPaste: () => void
  onDuplicate: () => void
  onDelete: () => void
  onDouble: () => void
  onHalf: () => void
  onOpenGridSettings: () => void
}

export function TimelineContextMenu({
  children,
  selectedIntervals,
  clipboard,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onDouble,
  onHalf,
  onOpenGridSettings,
}: TimelineContextMenuProps) {
  const hasSelection = selectedIntervals.length > 0
  const hasClipboard = clipboard.length > 0

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Copy */}
        {hasSelection && (
          <ContextMenuItem onClick={onCopy} className="flex items-center gap-2">
            <Copy size={14} />
            Copy
            <span className="ml-auto text-xs text-gray-500">Ctrl+C</span>
          </ContextMenuItem>
        )}

        {/* Paste */}
        {hasClipboard && (
          <ContextMenuItem
            onClick={onPaste}
            className="flex items-center gap-2">
            <ClipboardList size={14} />
            Paste
            <span className="ml-auto text-xs text-gray-500">Ctrl+V</span>
          </ContextMenuItem>
        )}

        {/* Duplicate */}
        {hasSelection && (
          <ContextMenuItem
            onClick={onDuplicate}
            className="flex items-center gap-2">
            <CopyPlus size={14} />
            Duplicate
            <span className="ml-auto text-xs text-gray-500">Ctrl+D</span>
          </ContextMenuItem>
        )}

        {/* Half Duration */}
        {hasSelection && (
          <ContextMenuItem onClick={onHalf} className="flex items-center gap-2">
            <RotateCcw size={14} />
            Half Duration
            <span className="ml-auto text-xs text-gray-500">Ctrl+[</span>
          </ContextMenuItem>
        )}

        {/* Double Duration */}
        {hasSelection && (
          <ContextMenuItem
            onClick={onDouble}
            className="flex items-center gap-2">
            <RotateCcw size={14} />
            Double Duration
            <span className="ml-auto text-xs text-gray-500">Ctrl+]</span>
          </ContextMenuItem>
        )}

        {/* Delete */}
        {hasSelection && (
          <ContextMenuItem
            onClick={onDelete}
            className="flex items-center gap-2 text-red-600">
            <Trash2 size={14} />
            Delete
            <span className="ml-auto text-xs text-gray-500">Delete</span>
          </ContextMenuItem>
        )}

        {/* Separator */}
        {(hasSelection || hasClipboard) && <ContextMenuSeparator />}

        {/* Grid Settings */}
        <ContextMenuItem
          onClick={onOpenGridSettings}
          className="flex items-center gap-2">
          <Settings size={14} />
          Change Grid Interval...
          <span className="ml-auto text-xs text-gray-500">Ctrl+G</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
