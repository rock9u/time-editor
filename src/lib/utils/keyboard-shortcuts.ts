import { KEYBOARD_SHORTCUTS } from '../constants'

export type ShortcutAction = keyof typeof KEYBOARD_SHORTCUTS

export interface ParsedShortcut {
  action: ShortcutAction
  ctrlOrCmd: boolean
  shift: boolean
  key: string
}

/**
 * Parses a keyboard shortcut string into its components
 * @param shortcut - The shortcut string (e.g., "Ctrl+C", "Delete", "Escape")
 * @returns Parsed shortcut object or null if invalid
 */
export function parseShortcut(shortcut: string): ParsedShortcut | null {
  // Handle special keys that don't have modifiers
  if (shortcut === 'Delete' || shortcut === 'Escape') {
    return {
      action: shortcut as ShortcutAction,
      ctrlOrCmd: false,
      shift: false,
      key: shortcut.toLowerCase(),
    }
  }

  // Parse modifier + key combinations (e.g., "Ctrl+C", "Ctrl+[")
  const regex = /^(Ctrl\+)(.+)$/
  const match = shortcut.match(regex)

  if (!match) {
    return null
  }

  const [, modifier, key] = match

  return {
    action: shortcut as ShortcutAction,
    ctrlOrCmd: modifier === 'Ctrl+',
    shift: false, // We'll handle shift separately in the keydown handler
    key: key.toLowerCase(),
  }
}

/**
 * Creates a mapping of keyboard events to actions based on KEYBOARD_SHORTCUTS
 * @returns Map of event signature to action
 */
export function createShortcutMap(): Map<string, ShortcutAction> {
  const shortcutMap = new Map<string, ShortcutAction>()

  Object.entries(KEYBOARD_SHORTCUTS).forEach(([action, shortcut]) => {
    const parsed = parseShortcut(shortcut)
    if (parsed) {
      // Create a unique signature for each shortcut
      const signature = `${parsed.ctrlOrCmd ? 'ctrl' : ''}${
        parsed.shift ? 'shift' : ''
      }${parsed.key}`
      shortcutMap.set(signature, action as ShortcutAction)
    }
  })

  return shortcutMap
}

/**
 * Checks if a keyboard event matches any defined shortcut
 * @param event - The keyboard event
 * @param shortcutMap - The shortcut mapping
 * @returns The matching action or null
 */
export function matchShortcut(
  event: KeyboardEvent,
  shortcutMap: Map<string, ShortcutAction>
): ShortcutAction | null {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey
  const isShift = event.shiftKey
  const key = event.key.toLowerCase()

  // Create the event signature
  const signature = `${isCtrlOrCmd ? 'ctrl' : ''}${
    isShift ? 'shift' : ''
  }${key}`

  return shortcutMap.get(signature) || null
}
