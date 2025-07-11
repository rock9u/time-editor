import React from 'react'
import { Copy, ClipboardList, CopyPlus, Trash2, RotateCcw } from 'lucide-react'
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
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
        {/* Selection Info */}
        {hasSelection && (
          <div className="text-sm text-gray-600 mr-4">
            {selectedIntervals.length} selected
          </div>
        )}

        {/* Copy Button */}
        {hasSelection && (
          <button
            onClick={onCopy}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors group relative"
            title="Copy selected intervals to clipboard (Ctrl+C)">
            <Copy size={16} />
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Copy (Ctrl+C)
            </span>
          </button>
        )}

        {/* Paste Button */}
        {hasClipboard && (
          <button
            onClick={onPaste}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors group relative"
            title="Paste intervals from clipboard (Ctrl+V)">
            <ClipboardList size={16} />
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Paste (Ctrl+V)
            </span>
          </button>
        )}

        {/* Duplicate Button */}
        {hasSelection && (
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors group relative"
            title="Duplicate selected intervals (Ctrl+D)">
            <CopyPlus size={16} />
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Duplicate (Ctrl+D)
            </span>
          </button>
        )}

        {/* Half Duration Button */}
        {hasSelection && (
          <button
            onClick={onHalf}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors group relative"
            title="Half the duration of selected intervals (Ctrl+[)">
            <RotateCcw size={16} />
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Half Duration (Ctrl+[)
            </span>
          </button>
        )}

        {/* Double Duration Button */}
        {hasSelection && (
          <button
            onClick={onDouble}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors group relative"
            title="Double the duration of selected intervals (Ctrl+])">
            <RotateCcw size={16} />
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Double Duration (Ctrl+])
            </span>
          </button>
        )}

        {/* Delete Button */}
        {hasSelection && (
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors group relative"
            title="Delete selected intervals (Delete)">
            <Trash2 size={16} />
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Delete (Delete)
            </span>
          </button>
        )}

        {/* Clear Selection Button */}
        {hasSelection && (
          <button
            onClick={onClearSelection}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors group relative"
            title="Clear selection (Escape)">
            ×
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Clear Selection (Esc)
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
