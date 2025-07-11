import React from 'react'
import {
  Copy,
  ClipboardList,
  CopyPlus,
  Trash2,
  RotateCcw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { KEYBOARD_SHORTCUTS } from '../../lib/constants'
import type { TimelineInterval } from '../../types/timeline'

interface TimelineToolbarProps {
  selectedIntervals: TimelineInterval[]
  clipboard: TimelineInterval[]
  onCopy: () => void
  onPaste: () => void
  onDuplicate: () => void
  onDelete: () => void
  onDouble: () => void
  onHalf: () => void
  onClearSelection: () => void
}

export function TimelineToolbar({
  selectedIntervals,
  clipboard,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onDouble,
  onHalf,
  onClearSelection,
}: TimelineToolbarProps) {
  const hasSelection = selectedIntervals.length > 0
  const hasClipboard = clipboard.length > 0

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
                  onClick={onCopy}
                  className="h-8 w-8 p-0">
                  <Copy size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy ({KEYBOARD_SHORTCUTS.COPY})</p>
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
                  onClick={onPaste}
                  className="h-8 w-8 p-0">
                  <ClipboardList size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Paste ({KEYBOARD_SHORTCUTS.PASTE})</p>
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
                  onClick={onDuplicate}
                  className="h-8 w-8 p-0">
                  <CopyPlus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate ({KEYBOARD_SHORTCUTS.DUPLICATE})</p>
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
                  onClick={onHalf}
                  className="h-8 w-8 p-0">
                  <RotateCcw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Half Duration ({KEYBOARD_SHORTCUTS.HALF})</p>
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
                  onClick={onDouble}
                  className="h-8 w-8 p-0">
                  <RotateCcw size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Double Duration ({KEYBOARD_SHORTCUTS.DOUBLE})</p>
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
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete ({KEYBOARD_SHORTCUTS.DELETE})</p>
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
                <p>Clear Selection ({KEYBOARD_SHORTCUTS.CLEAR_SELECTION})</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
