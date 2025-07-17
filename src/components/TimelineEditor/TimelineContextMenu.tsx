import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useTimeline } from '@/contexts/TimelineContext'
import {
  ClipboardList,
  Copy,
  CopyPlus,
  RotateCcw,
  Settings,
  Trash2,
} from 'lucide-react'
import type { TimelineContextMenuProps } from '../../types/shared-props'

export function TimelineContextMenu({
  children,
  onOpenGridSettings,
}: TimelineContextMenuProps) {
  const { state, keyboardShortcuts, actionHandlers } = useTimeline()

  const hasSelection = state.selectedIntervalIds.size > 0
  const hasClipboard = state.clipboard.length > 0

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-background text-foreground">
        {/* Copy */}
        {hasSelection && (
          <ContextMenuItem
            onClick={actionHandlers.handleCopy}
            className="flex items-center gap-2">
            <Copy size={14} />
            Copy
            <span className="ml-auto text-xs text-gray-500">
              {keyboardShortcuts.COPY}
            </span>
          </ContextMenuItem>
        )}

        {/* Paste */}
        {hasClipboard && (
          <ContextMenuItem
            onClick={actionHandlers.handlePaste}
            className="flex items-center gap-2">
            <ClipboardList size={14} />
            Paste
            <span className="ml-auto text-xs text-gray-500">
              {keyboardShortcuts.PASTE}
            </span>
          </ContextMenuItem>
        )}

        {/* Duplicate */}
        {hasSelection && (
          <ContextMenuItem
            onClick={actionHandlers.handleDuplicate}
            className="flex items-center gap-2">
            <CopyPlus size={14} />
            Duplicate
            <span className="ml-auto text-xs text-gray-500">
              {keyboardShortcuts.DUPLICATE}
            </span>
          </ContextMenuItem>
        )}

        {/* Half Duration */}
        {hasSelection && (
          <ContextMenuItem
            onClick={actionHandlers.handleHalf}
            className="flex items-center gap-2">
            <RotateCcw size={14} />
            Half Duration
            <span className="ml-auto text-xs text-gray-500">
              {keyboardShortcuts.HALF}
            </span>
          </ContextMenuItem>
        )}

        {/* Double Duration */}
        {hasSelection && (
          <ContextMenuItem
            onClick={actionHandlers.handleDouble}
            className="flex items-center gap-2">
            <RotateCcw size={14} />
            Double Duration
            <span className="ml-auto text-xs text-gray-500">
              {keyboardShortcuts.DOUBLE}
            </span>
          </ContextMenuItem>
        )}

        {/* Delete */}
        {hasSelection && (
          <ContextMenuItem
            onClick={actionHandlers.handleDelete}
            className="flex items-center gap-2 text-red-600">
            <Trash2 size={14} />
            Delete
            <span className="ml-auto text-xs text-gray-500">
              {keyboardShortcuts.DELETE}
            </span>
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
          <span className="ml-auto text-xs text-gray-500">
            {keyboardShortcuts.GRID_SETTINGS}
          </span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
