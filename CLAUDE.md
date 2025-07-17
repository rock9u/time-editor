# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
pnpm run dev

# Build the project
pnpm run build

# Lint the code
pnpm run lint

# Preview the built application
pnpm run preview
```

## Architecture Overview

This is a React + TypeScript timeline editor application built with Vite. The application allows users to create, edit, and manage timeline intervals with a grid-based interface.

### Key Technologies

- **React 19** with TypeScript
- **Vite** for build tooling with SWC for fast refresh
- **Tailwind CSS v4** for styling
- **Radix UI** components for accessible UI primitives
- **Luxon** for date/time manipulation
- **@dnd-kit** for drag and drop functionality
- **shadcn/ui** component system (configured in `components.json`)
- **pnpm** for package management

### Core Architecture Components

#### State Management

- **TimelineContext** (`src/contexts/TimelineContext.tsx`): Central state management using React Context + useReducer
- **TimelineIntervalV2** interface: New interval structure using `startTime + gridUnit + gridAmount` instead of `startTime + endTime`
- **useTimelineReducer** (`src/components/TimelineEditor/useTimelineReducer.ts`): Legacy reducer for backward compatibility

#### Main Components

- **TimelineEditor** (`src/components/TimelineEditor/TimelineEditor.tsx`): Main editor component with comprehensive keyboard shortcuts
- **IntervalGrid** (`src/components/TimelineEditor/IntervalGrid.tsx`): Grid-based timeline visualization
- **TimelineContextMenu** (`src/components/TimelineEditor/TimelineContextMenu.tsx`): Right-click context menu
- **IntervalEditDialog** (`src/components/TimelineEditor/IntervalEditDialog.tsx`): Modal for editing interval properties

#### Key Features

- **Keyboard Shortcuts**:

  - `Ctrl/Cmd + C`: Copy selected intervals
  - `Ctrl/Cmd + V`: Paste intervals
  - `Ctrl/Cmd + D`: Duplicate selected intervals
  - `Ctrl/Cmd + [`: Half duration of selected intervals
  - `Ctrl/Cmd + ]`: Double duration of selected intervals
  - `Ctrl/Cmd + G`: Open grid settings
  - `Delete/Backspace`: Delete selected intervals
  - `Escape`: Clear selection

- **Grid System**: Configurable grid units (day, month, year) with customizable values
- **Theme Support**: Dark/light mode toggle with system preference detection
- **Drag & Drop**: Interval repositioning and resizing
- **Multi-selection**: Select multiple intervals for batch operations

#### Data Structure

```typescript
interface TimelineIntervalV2 {
  id: string
  startTime: number // Unix timestamp in milliseconds
  gridUnit: GridIntervalUnit // 'day', 'month', 'year'
  gridAmount: number // How many grid units this interval spans
  metadata?: {
    label?: string
    color?: string
    description?: string
    tags?: string[]
  }
}
```

#### Utilities

- **timeline-utils-v2.ts**: Modern utility functions for interval calculations
- **timeline-utils.ts**: Legacy utility functions (maintained for compatibility)
- **keyboard-utils.ts**: Keyboard event handling utilities

### Path Aliases

- `@/*` maps to `./src/*` (configured in `tsconfig.json` and `vite.config.ts`)
- Common aliases: `@/components`, `@/lib`, `@/types`, `@/contexts`

### Styling

- Uses Tailwind CSS v4 with CSS variables for theming
- shadcn/ui components styled with "new-york" variant
- Lucide React for icons
- Custom CSS in `src/index.css`

## Development Notes

### Type Safety

- Strict TypeScript configuration with separate `tsconfig.app.json` and `tsconfig.node.json`
- Type definitions in `src/types/timeline.ts`
- Environment types in `src/vite-env.d.ts`

### Error Handling

- React Error Boundary implemented in `App.tsx` with fallback UI
- Validation functions for timeline intervals in types

### Performance Considerations

- Uses React 19 features
- SWC for fast refresh during development
- Optimized with useCallback and useMemo where appropriate

### Code Organization

- Feature-based component organization under `src/components/`
- Shared UI components in `src/components/ui/`
- Type definitions centralized in `src/types/`
- Utility functions in `src/lib/`
- Context providers in `src/contexts/`

## Project Memories

- Almost use pnpm for package management

## Detailed Product Requirements: Timeline Interval Editor Component

[... rest of the existing content remains unchanged ...]