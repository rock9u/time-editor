import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTimeline } from '@/contexts/TimelineContext'
import {
  ClipboardList,
  Copy,
  CopyPlus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import type { TimelineToolbarProps } from '../../types/shared-props'

export function TimelineToolbar({
  onClearSelection,
}: TimelineToolbarProps) {
  const { state, keyboardShortcuts, actionHandlers } = useTimeline()
  
  const hasSelection = state.selectedIntervalIds.size > 0
  const hasClipboard = state.clipboard.length > 0
  const selectedIntervals = state.intervals.filter(interval =>
    state.selectedIntervalIds.has(interval.id)
  )

  if (!hasSelection && !hasClipboard) return null

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
          {/* Selection Info */}
          {hasSelection && (
            <Badge variant="secondary" className="mr-2">
              {selectedIntervals.length} selected
            </Badge>
          )}

          {/* Copy Button */}
          {hasSelection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actionHandlers.handleCopy}
                  className="h-8 w-8 p-0">
                  <Copy size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy ({keyboardShortcuts.COPY})</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Paste Button */}
          {hasClipboard && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actionHandlers.handlePaste}
                  className="h-8 w-8 p-0">
                  <ClipboardList size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Paste ({keyboardShortcuts.PASTE})</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Duplicate Button */}
          {hasSelection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actionHandlers.handleDuplicate}
                  className="h-8 w-8 p-0">
                  <CopyPlus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate ({keyboardShortcuts.DUPLICATE})</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Half Duration Button */}
          {hasSelection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actionHandlers.handleHalf}
                  className="h-8 w-8 p-0">
                  <RotateCcw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Half Duration ({keyboardShortcuts.HALF})</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Double Duration Button */}
          {hasSelection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actionHandlers.handleDouble}
                  className="h-8 w-8 p-0">
                  <RotateCcw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Double Duration ({keyboardShortcuts.DOUBLE})</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Delete Button */}
          {hasSelection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actionHandlers.handleDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete ({keyboardShortcuts.DELETE})</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Clear Selection Button */}
          {hasSelection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  className="h-8 w-8 p-0">
                  <X size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear Selection ({keyboardShortcuts.CLEAR_SELECTION})</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
