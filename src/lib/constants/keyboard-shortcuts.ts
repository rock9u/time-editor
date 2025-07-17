// Platform-aware keyboard shortcuts
export const PLATFORM_SHORTCUTS = {
  MAC: {
    COPY: '⌘C',
    PASTE: '⌘V',
    DUPLICATE: '⌘D',
    HALF: '⌘[',
    DOUBLE: '⌘]',
    DELETE: 'Delete,Backspace',
    CLEAR_SELECTION: 'Escape',
    GRID_SETTINGS: '⌘G',
  },
  WINDOWS: {
    COPY: 'Ctrl+C',
    PASTE: 'Ctrl+V',
    DUPLICATE: 'Ctrl+D',
    HALF: 'Ctrl+[',
    DOUBLE: 'Ctrl+]',
    DELETE: 'Delete,Backspace',
    CLEAR_SELECTION: 'Escape',
    GRID_SETTINGS: 'Ctrl+G',
  },
  LINUX: {
    COPY: 'Ctrl+C',
    PASTE: 'Ctrl+V',
    DUPLICATE: 'Ctrl+D',
    HALF: 'Ctrl+[',
    DOUBLE: 'Ctrl+]',
    DELETE: 'Delete,Backspace',
    CLEAR_SELECTION: 'Escape',
    GRID_SETTINGS: 'Ctrl+G',
  },
} as const

// Platform detection function
export function getPlatform(): 'MAC' | 'WINDOWS' | 'LINUX' {
  if (typeof window === 'undefined') return 'LINUX' // Default for SSR
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('mac')) return 'MAC'
  if (userAgent.includes('win')) return 'WINDOWS'
  return 'LINUX'
}

// Get platform-specific shortcuts
export function getPlatformShortcuts() {
  const platform = getPlatform()
  return PLATFORM_SHORTCUTS[platform]
}

// Keyboard event matcher
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: keyof typeof PLATFORM_SHORTCUTS['MAC']
): boolean {
  const platform = getPlatform()
  const shortcuts = PLATFORM_SHORTCUTS[platform]
  const shortcutString = shortcuts[shortcut]
  
  // Handle special cases for single key shortcuts
  if (shortcutString === 'Delete,Backspace') {
    return (event.key === 'Delete' || event.key === 'Backspace') && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  }
  if (shortcutString === 'Escape') {
    return event.key === shortcutString && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
  }
  
  // Parse the shortcut string - handle ⌘ properly
  const parts = shortcutString.includes('⌘') ? shortcutString.split('⌘') : shortcutString.split('+')
  const key = parts[parts.length - 1]
  
  // Check modifiers
  const needsCmd = shortcutString.includes('⌘')
  const needsCtrl = shortcutString.includes('Ctrl')
  const needsShift = shortcutString.includes('Shift')
  const needsAlt = shortcutString.includes('Alt')
  
  // Check if the event matches
  const keyMatches = event.key === key || event.key.toLowerCase() === key.toLowerCase() || event.code === `Key${key.toUpperCase()}`
  
  // For Mac, ⌘ maps to metaKey
  // For Windows/Linux, Ctrl maps to ctrlKey
  const modifierMatches = platform === 'MAC' 
    ? (needsCmd ? event.metaKey : !event.metaKey) && !event.ctrlKey
    : (needsCtrl ? event.ctrlKey : !event.ctrlKey) && !event.metaKey
  
  const shiftMatches = needsShift ? event.shiftKey : !event.shiftKey
  const altMatches = needsAlt ? event.altKey : !event.altKey
  
  const result = keyMatches && modifierMatches && shiftMatches && altMatches
  
  // Debug logging for troubleshooting
  if (event.metaKey || event.ctrlKey) {
    console.log(`Shortcut matching for ${shortcut}:`, {
      shortcut,
      platform,
      shortcutString,
      key,
      eventKey: event.key,
      eventCode: event.code,
      keyMatches,
      modifierMatches,
      shiftMatches,
      altMatches,
      result,
      needsCmd,
      needsCtrl,
      eventModifiers: {
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey
      }
    })
  }
  
  return result
}