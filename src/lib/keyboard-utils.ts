export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}

export function parseShortcut(shortcut: string): KeyboardShortcut {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const modifiers = parts.slice(0, -1)

  return {
    key,
    ctrlKey: modifiers.includes('ctrl'),
    shiftKey: modifiers.includes('shift'),
    altKey: modifiers.includes('alt'),
    metaKey: modifiers.includes('meta'),
  }
}

export function matchShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut)

  return (
    event.key.toLowerCase() === parsed.key &&
    !!event.ctrlKey === !!parsed.ctrlKey &&
    !!event.shiftKey === !!parsed.shiftKey &&
    !!event.altKey === !!parsed.altKey &&
    !!event.metaKey === !!parsed.metaKey
  )
}

export function createKeyboardHandler(shortcuts: Record<string, () => void>) {
  return (event: KeyboardEvent) => {
    // Only handle shortcuts if no input is focused
    if (
      document.activeElement?.tagName === 'INPUT' ||
      document.activeElement?.tagName === 'TEXTAREA'
    ) {
      return
    }

    for (const [shortcut, handler] of Object.entries(shortcuts)) {
      if (matchShortcut(event, shortcut)) {
        event.preventDefault()
        handler()
        break
      }
    }
  }
}
