# Project overview

- react component that visualizes timeline and intervals of datasets from user. This component uses React, Lucid icon, shadcn, tailwindcss, luxon, vite

# Core functionality

---

## Detailed Product Requirements: Timeline Interval Editor Component

**Project Goal:** Develop a versatile React component, `TimelineEditor`, that allows users to visualize, create, edit, and manage time intervals on a grid-based timeline. The component should support in-memory CRUD operations, export functionality, and intuitive user interactions including snap-to-grid, batch editing, and keyboard shortcuts.

**Core Technologies:** React, TypeScript, Luxon, Shadcn UI, Tailwind CSS, Lucide Icons, Vite, dnd-kit.

---

### 1. Component Structure & Setup

**1.1. Root Component (`src/components/TimelineEditor/TimelineEditor.tsx`)**
_ This will be the main entry point for the timeline editor.
_ It will manage the overall state of the intervals and grid settings. \* It will orchestrate the rendering of sub-components (grid, toolbar, settings panel).

**1.2. State Management (`src/components/useRampIntervalReducer.ts`)**
_ **Purpose:** Centralized state management for all `TimelineInterval` objects.
_ **Hook:** Implement a custom `useReducer` hook, potentially named `useIntervalsReducer` or similar, to manage the `intervals` array.
_ **Actions:** Define actions for `ADD_INTERVAL`, `UPDATE_INTERVAL`, `DELETE_INTERVAL`, `SET_INTERVALS`, `BATCH_UPDATE_INTERVALS`, `SET_SELECTED_INTERVALS`, `CLEAR_SELECTED_INTERVALS`.
_ **Initial State:** An empty array `TimelineInterval[]`.

**1.3. Data Model (`src/types/timeline.ts` - new file)** \* Define the TypeScript interface for a `TimelineInterval`:

```typescript
// src/types/timeline.ts
export interface TimelineInterval {
  id: string // Unique identifier (e.g., UUID v4)
  startTime: number // Unix timestamp in milliseconds
  endTime: number // Unix timestamp in milliseconds
  metadata?: {
    // Optional metadata for future expansion (e.g., label, color)
    label?: string
    [key: string]: any
  }
}

export type GridIntervalUnit = 'day' | 'month' | 'year'

export interface GridSettings {
  unit: GridIntervalUnit // e.g., 'month', 'day'
  value: number // e.g., 1 (for 1 month), 30 (for 30 days)
}
```

**1.4. Global Constants (`src/lib/constants.ts` - new file)** \* Define constants such as default grid interval settings.

```typescript
// src/lib/constants.ts
import { GridSettings } from '../types/timeline'

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  unit: 'month',
  value: 1,
}

export const GRID_INTERVAL_UNITS: GridIntervalUnit[] = ['day', 'month', 'year'] // For dropdown
export const GRID_UNIT_LABELS: Record<GridIntervalUnit, string> = {
  day: 'Day(s)',
  month: 'Month(s)',
  year: 'Year(s)',
}
```

---

### 2. Core Visualization - The Timeline Grid (`src/components/TimelineEditor/IntervalGrid.tsx`)

**2.1. Canvas and Layout**
_ Use a combination of `div` elements with Tailwind CSS for layout. A `display: grid` or `position: relative` with absolute positioning will be effective.
_ The grid should have a defined start and end timestamp (e.g., `minDate`, `maxDate`). These can be passed as props or derived from the earliest/latest interval. For initial implementation, define a fixed range (e.g., 10 years centered around today).
_ **Grid Cell Calculation:**
_ Determine a fixed pixel width for a single "grid unit" (e.g., `pixelsPerGridUnit`). This will be dynamic based on the total timeline span and the grid interval settings.
_ Calculate the total width of the grid based on `minDate`, `maxDate`, and `pixelsPerGridUnit`.
_ **Timestamp to Pixel Conversion:** Implement a utility function `timestampToPixels(timestamp: number, minDate: DateTime, pixelsPerMs: number)` and `pixelsToTimestamp(pixels: number, minDate: DateTime, pixelsPerMs: number)`. `pixelsPerMs` will be `pixelsPerGridUnit` divided by the milliseconds in one grid unit.

**2.2. Grid Lines Rendering**
_ Iterate from `minDate` to `maxDate` using `luxon.DateTime.plus()`.
_ For each grid line:
_ **Calculation:** Start at `minDate` (snapped to the start of its `gridIntervalUnit`), then repeatedly add `gridIntervalValue` of `gridIntervalUnit` using `luxon.DateTime.plus({ [gridIntervalUnit]: gridIntervalValue })`.
_ **Display:** Render vertical lines (`div` with `border-l` or similar) at the calculated pixel position. \* **Labels:** Display the date/time (e.g., "Jan 2023", "Q1 2023", "2023") at appropriate intervals. Use `luxon.DateTime.toFormat()` for flexible formatting.

**2.3. Interval Badge Rendering**
_ For each `TimelineInterval` in the `intervals` state:
_ **Positioning:** Calculate the `left` pixel position based on `interval.startTime` and `width` based on `interval.endTime - interval.startTime`.
_ `left = timestampToPixels(interval.startTime, minDate, pixelsPerMs)`
_ `width = (interval.endTime - interval.startTime) * pixelsPerMs`
_ **Visual:** Render a `Badge` component from Shadcn UI (`<Badge>`) representing the interval.
_ **Selection State:** Apply a distinct style (e.g., `border-2 border-blue-500`) if the interval's `id` is present in the `selectedIntervalIds` state. \* **Handles:** Implement small, clickable/draggable handles at the start and end of the badge for resizing.

**2.4. Grid Types (Preview vs. Editing)**
_ **Preview:** A simplified, read-only visualization spanning the entire timeline. This might be a separate, smaller component or a specific mode of `IntervalGrid`. It primarily shows the `Badge` elements without interaction.
_ **Editing:** The main interactive `IntervalGrid` component, supporting all CRUD operations. This is the primary focus.

---

### 3. Interaction: Creating Intervals

**3.1. Click and Drag Creation**
_ **Event Listener:** Attach `onMouseDown` to the background of `IntervalGrid` (or a transparent overlay).
_ **Start Creation:**
_ On `onMouseDown`, record the mouse `clientX` position. Convert this pixel position to a snapped `startTime` timestamp using `pixelsToTimestamp` and `luxon.DateTime.startOf(gridIntervalUnit)`.
_ Set a `isCreating` state to `true` and store the `creationStartTimestamp`.
_ **Visual Feedback (`creationMarquee`):**
_ On `onMouseMove` while `isCreating` is `true`, draw a temporary selection rectangle (marquee) from `creationStartTimestamp` to the current snapped `endTime` timestamp.
_ The marquee's `left` and `width` should dynamically update based on snapped cursor position.
_ **Complete Creation:**
_ On `onMouseUp`, if `isCreating` is `true`:
_ Get the final `endTime` from the snapped cursor position.
_ Ensure `startTime` is always less than `endTime`. If not, swap them.
_ Generate a unique `id` (e.g., `crypto.randomUUID()`).
_ Dispatch `ADD_INTERVAL` action with the new `TimelineInterval` object `{ id, startTime, endTime }`.
_ Reset `isCreating` to `false`.

---

### 4. Interaction: Selecting Intervals & Regions

**4.1. Individual Interval Selection**
_ **Event Listener:** Attach `onClick` to each interval badge.
_ **Behavior:**
_ Clicking an unselected badge: Selects it (add `id` to `selectedIntervalIds`).
_ Clicking a selected badge: Deselects it (remove `id`).
_ `Cmd/Ctrl + Click`: Toggles selection without affecting other selected items.
_ Clicking outside any interval: Clears all selections. \* **State:** Maintain `selectedIntervalIds: Set<string>` in `TimelineEditor`'s state.

**4.2. Region Selection (Marquee Selection)**
_ **Event Listener:** Similar to interval creation, `onMouseDown` on the grid background.
_ **Start Selection:** Record `selectionStartX` (pixel). Set `isSelecting` state to `true`.
_ **Visual Feedback:** On `onMouseMove`, draw a selection marquee (`div` with `background-color` and `opacity`) from `selectionStartX` to the current `clientX`.
_ **Logic on Mouse Up:**
_ Convert `selectionStartX` and `selectionEndX` (current `clientX`) to snapped `startOfSelectionTimestamp` and `endOfSelectionTimestamp`.
_ Iterate through all `intervals` in state.

- For each interval, check if it _overlaps_ or is _contained_ within the `[startOfSelectionTimestamp, endOfSelectionTimestamp]` range.
- Overlap condition: `(interval.startTime < endOfSelectionTimestamp && interval.endTime > startOfSelectionTimestamp)`.
  _ Add the `id` of all overlapping/contained intervals to the `selectedIntervalIds` set.
  _ **"Total Section" Highlight:** Visually render an overlay on the grid covering the `[startOfSelectionTimestamp, endOfSelectionTimestamp]` range (e.g., a faint gray background `div`). This highlights the _grid area_ selected, not just the intervals. This overlay should disappear when selection is cleared. \* Reset `isSelecting` to `false`.

---

### 5. Interaction: Editing Intervals (Individual)

**5.1. Drag and Drop (Move)**
_ **Event Listener:** Attach `onMouseDown` to the interval badge itself.
_ **Start Drag:**
_ Record `initialIntervalStartTime` and `initialMouseX`.
_ Set `isDragging` state to `true`.
_ **During Drag:**
_ On `onMouseMove`, calculate `deltaX = currentMouseX - initialMouseX`.
_ Convert `deltaX` to `deltaTime` (milliseconds) using `pixelsPerMs`.
_ Calculate `newStartTime = initialIntervalStartTime + deltaTime`.
_ **Snap-to-Grid:** `newStartTime` should be snapped to the nearest `gridIntervalUnit` line. Use `luxon.DateTime.fromMillis(newStartTime).startOf(gridIntervalUnit).toMillis()`.
_ Calculate `newEndTime` by maintaining the original duration (`newStartTime + (initialInterval.endTime - initialInterval.startTime)`).
_ Visually update the position of the badge (using `transform: translateX` or updating `left` CSS property directly).
_ **End Drag:**
_ On `onMouseUp`, if `isDragging` is `true`:
_ Dispatch `UPDATE_INTERVAL` action with the interval's `id`, `newStartTime`, and `newEndTime`. \* Reset `isDragging` to `false`.

**5.2. Resize (Edges)**
_ **Event Listener:** Attach `onMouseDown` to the small resize handles at the start/end of the interval block and badge. around 4px and it has filter indication and border.
_ **Start Resize:**
_ Determine if resizing `start` or `end`. Record `initialInterval` and `initialMouseX`.
_ add a new mode "resizing".
_ **During Resize:**
_ On `onMouseMove`, calculate `deltaX`.
_ Convert `deltaX` to `deltaTime`.
_ If resizing start: `newStartTime = initialInterval.startTime + deltaTime`. Snap `newStartTime`. Ensure `newStartTime < interval.endTime`.
_ If resizing end: `newEndTime = initialInterval.endTime + deltaTime`. Snap `newEndTime`. Ensure `newEndTime > interval.startTime`.
_ Visually update the badge's `width` and/or `left` position.
_ **End Resize:**
_ On `onMouseUp`, if mode is resizing:
_ Dispatch `UPDATE_INTERVAL` action with the interval's `id`, `newStartTime` (if start was resized), and `newEndTime` (if end was resized).
_ Reset mode to "none".

**5.3. Double-Click for Metadata/Timestamp Editing**
_ **Event Listener:** Attach `onDoubleClick` to each interval badge.
_ **Action:** Open a Shadcn UI `Dialog` (modal) or `Popover`.
_ **Content:**
_ Inside the dialog/popover, display a `Calendar` component (`shadcn/ui/calendar`) for date selection.
_ Alongside it, a time input (can be a simple input field for `HH:MM` or a custom `shadcn/ui/time-picker` if available/created).
_ The values should pre-populate from the `startTime` of the double-clicked interval.
_ A "Save" button.
_ **Data Handling:**
_ When changes are made, update a temporary state within the modal.
_ On "Save", convert the selected date and time back to a Unix timestamp (milliseconds).
_ Dispatch `UPDATE_INTERVAL` action for the specific interval's `startTime` (and potentially `endTime` if implemented).
_ Close the dialog.

---

### 6. Interaction: Batch Editing (Toolbar & Context Menu)

**6.1. Floating Toolbar (`src/components/TimelineEditor/TimelineToolbar.tsx`)**

- **Visibility:** Only visible when `selectedIntervalIds` is not empty.
- **Positioning:** Can be fixed at the top/bottom of the `TimelineEditor` or intelligently positioned near the selected intervals.
- **Components:** Use `shadcn/ui/button` with `lucide-react` icons.
- **Actions (Buttons):**
- **Copy:** `lucide-react/Copy` icon. On click: Deep clone the currently `selectedIntervals` and store them in a temporary `clipboard` state (within `TimelineEditor` or a dedicated context). Clear `selectedIntervalIds`.
- **Paste:** `lucide-react/ClipboardList` icon. On click:
- For each item in `clipboard`:
- Generate a _new unique `id`_.
- Create a new `startTime` and `endTime` by offsetting the original `startTime` and `endTime` by a small, fixed amount (e.g., 1 grid unit to the right or down, or 1 day/week). This prevents pasted items from perfectly overlapping original ones.
- Dispatch `ADD_INTERVAL` for each new interval.
- Clear `clipboard`.
- **Duplicate:** `lucide-react/CopyPlus` icon. On click: Similar to paste, but the source is the `selectedIntervals` themselves. Generate new IDs and offset them. Keep original selected. \* **Delete:** `lucide-react/Trash` icon. On click: Dispatch `DELETE_INTERVAL` action for all `selectedIntervalIds`. Clear `selectedIntervalIds`.
- `x2 (Double)`: Trigger Doubling action (if `selectedIntervals` exist), the duration is transforming into doubled total time span, each interval block is doubled in size, including empty duration within the selected region.

**6.2. Keyboard Shortcuts**

- **Event Listener:** Implement a global `keydown` event listener on the `TimelineEditor` component using `useEffect` with cleanup.
- **Conditional Execution:** Only execute if focus is within the `TimelineEditor` or if no specific input field is focused.
- **Shortcuts:**
- `Cmd/Ctrl + C`: Trigger Copy action (if `selectedIntervals` exist).
- `Cmd/Ctrl + V`: Trigger Paste action (if `clipboard` is not empty).
- `Cmd/Ctrl + D`: Trigger Duplicate action (if `selectedIntervals` exist).
- `Cmd/Ctrl +Shift+ D`: Trigger Doubling action (if `selectedIntervals` exist), the duration is transforming into doubled total time span, each interval block is doubled in size, including empty duration within the selected region.
- `Delete` or `Backspace`: Trigger Delete action (if `selectedIntervals` exist).
- `Cmd/Ctrl + 1`: Trigger "Change Grid Interval" panel (see next section).

**6.3. Context Menu (`shadcn/ui/context-menu`)**

- **Event Listener:** Attach `onContextMenu` (right-click) to the `IntervalGrid` background and optionally to individual interval badges.
- **Content:**
- `shadcn/ui/context-menu` items:
- "Copy" (enabled if `selectedIntervals` exist)
- "Paste" (enabled if `clipboard` is not empty)
- "Duplicate" (enabled if `selectedIntervals` exist)
- "x2 (Double)" (enabled if `selectedIntervals` exist)
- "Delete" (enabled if `selectedIntervals` exist)
- Separator
- "Change Grid Interval..." (always enabled)
- **Action Mapping:** Each menu item should dispatch the corresponding action as defined for the toolbar/keyboard shortcuts.

---

### 7. Interaction: Grid Settings Panel (`src/components/TimelineEditor/GridSettingsPanel.tsx`)

**7.1. Trigger**
_ Keyboard shortcut: `Cmd/Ctrl + 1`.
_ Context menu action: "Change Grid Interval...". \* (Optional: A dedicated "Settings" icon button in the toolbar).

**7.2. UI (`shadcn/ui/dialog` or `shadcn/ui/popover`)**
_ Open a `Dialog` or `Popover` for the settings panel.
_ **Controls:**
_ **Unit Selection:** A `shadcn/ui/select` or radio group for `GridIntervalUnit` (`day`, `month`, `year`).
_ Map to user-friendly labels (e.g., "Day(s)", "Month(s)", "Year(s)").
_ **Value Input:** A `shadcn/ui/input` of type `number` for `gridIntervalValue`.
_ Example: If unit is "Day", value could be 1, 7, 30. If "Month", value could be 1, 3, 6, 12. \* **Apply/Save:** A button to apply changes, which updates the `gridSettings` state in the `TimelineEditor` component.

**7.3. Luxon Handling for Grid Intervals (Crucial)**
_ When calculating grid lines and snapping:
_ For `unit: 'day'`, `value: N`: Use `luxon.DateTime.plus({ days: N })` and `DateTime.startOf('day')`.
_ For `unit: 'month'`, `value: N`: Use `luxon.DateTime.plus({ months: N })` and `DateTime.startOf('month')`.
_ For `unit: 'year'`, `value: N`: Use `luxon.DateTime.plus({ years: N })` and `DateTime.startOf('year')`.

- **Important:** `plus({ days: 30 })` and `plus({ months: 1 })` are _different_ in Luxon due to calendar accuracy (leap years, varying month lengths, DST). The implementation \*must\* respect this distinction. The settings panel should offer both "X Days" and "X Months" as distinct options if this level of precision is required by the user. If the intent is simplified, maybe "30 days" maps to `plus({ days: 30 })` and "1 month" maps to `plus({ months: 1 })`. The prompt indicates this difference, so we must expose it via the `unit` and `value` combination.

---

### 8. Export Functionality

**8.1. Export Button** \* Add a `shadcn/ui/button` labeled "Export Data" (or similar) in the `TimelineEditor` component (e.g., at the top right).

**8.2. Data Export**
_ On button click:
_ Serialize the current `intervals: TimelineInterval[]` array to a JSON string using `JSON.stringify()`.
_ Create a `Blob` with `type: 'application/json'`.
_ Create a download URL using `URL.createObjectURL()`.
_ Programmatically create a temporary `<a>` element, set its `href` to the download URL, set `download` attribute (e.g., `timeline_intervals_${Date.now()}.json`), and programmatically click it.
_ Revoke the object URL after download using `URL.revokeObjectURL()`.

---

### 9. Technical & Utility Details

**9.1. Date/Time Utilities (`src/lib/utils.ts` or `src/utils.ts`)**
_ **`convertPixelsToTime(pixels: number, minDate: DateTime, pixelsPerMs: number): DateTime`**
_ **`convertTimeToPixels(date: DateTime, minDate: DateTime, pixelsPerMs: number): number`**
_ **`snapToGrid(timestamp: number, gridSettings: GridSettings): number`**:
_ Uses `luxon.DateTime.fromMillis(timestamp).startOf(gridSettings.unit).toMillis()`.
_ **`generateUUID(): string`**: For `TimelineInterval` IDs.
_ **`deepClone<T>(obj: T): T`**: Essential for copy/paste operations to prevent shared references.

**9.2. Performance Considerations** \* For a large number of intervals (e.g., 1000+), consider virtualizing the grid rows or columns using libraries like `react-window` or `react-virtualized`. Start without it, and optimize if performance issues arise.

**9.3. Accessibility (A11y)** \* Ensure all interactive elements (buttons, draggable intervals, input fields) are keyboard-navigable and have appropriate ARIA attributes.

**9.4. Styling**
_ Leverage Tailwind CSS for all styling.
_ Use `shadcn/ui` components for consistency and rapid development (buttons, dialogs, selects, badges, context menus).

---

### 10. Future Considerations (Out of Scope for initial MVP, but good to note)

- **Import Functionality:** Ability to import interval data from a JSON file.
- **Persistent Storage:** Saving/loading intervals beyond in-memory state (e.g., to a backend API, localStorage, IndexedDB).
- **Multi-Track Timelines:** Displaying multiple independent sets of intervals on separate "tracks" within the same timeline.
- **Interval Metadata Editor:** Expanding the double-click modal to allow editing more `metadata` fields (e.g., custom label, color picker).
- **Zooming/Panning:** Dynamic scaling of the timeline view.
- **Undo/Redo:** Implementing an action history for state changes.
- **Timezone Support:** Explicit handling of timezones (Luxon supports this). Defaulting to local system timezone for now.

---

This detailed breakdown provides the engineering team with clear, actionable requirements, including technical implementation details and considerations for chosen libraries.

### Bugs:

1. [x] double clicking and dragging always lands on the left side of the grid when creating no matter how close is it to the right grid line. it should start with chose the right grid line when it's close. also after double clicking, the visual indicator should already land in the grid line instead of where user selects. this will reduce the confusion.
2. when drag an drop timelines, and the grid is set to month. setup a full june interval, a full july interval. move both to feb and march. July to march would not work because the interval in terms of days are 30 days. i think we should refactor the state management a bit. right now we are storing everything in start/end datetime. we should do start datetime, then use grid type and gird amount to reduce bugs like this.
3. [x] missing indication of selected intervals/badge block. we should add some white border and filter to them to show that they are selected.
4. [x] when drag and drop, the badge and interval box are not following mouse fully. this needs to be more snappy. we should use dnd kit library to implement drag and drop for convenience.
5. [x] when drag an drop timelines, and the grid is set to month. setup a full june interval, a full july interval. move both to feb and march. July to march would not work because the interval in terms of days are 30 days. i think we should refactor the state management a bit. right now we are storing everything in start/end datetime. we should do start datetime, then use grid type and gird amount to reduce bugs like this.
6. we should add batch drag and drop after multiple elements are all select. right now only the single element will be moved
7. after double clicking, a interval of 1 grid unit should always default placed, the rest of the drag increase behaviour should be the same
8. the resize region should show indicator on hover. and it should allowed to be used without need to select it first.
9. after clicking and dragging, attempting to just select the grid, with the very change the interval moves a whole grid a head. lets add a threshhold delta when we change the mode to "repositon". half of the current intervals' with maybe.
10. [x] need more info on toolbar's action, adding hover text for each icon.

# Doc

## luxon docs

https://moment.github.io/luxon/api-docs/index.html

plus(duration)

Add a period of time to this DateTime and return the resulting DateTime

Adding hours, minutes, seconds, or milliseconds increases the timestamp by the right number of milliseconds. Adding days, months, or years shifts the calendar, accounting for DSTs and leap years along the way. Thus, dt.plus({ hours: 24 }) may result in a different time than dt.plus({ days: 1 }) if there's a DST shift in between.
plus(duration: (Duration | Object | number)): DateTime
Parameters
duration ((Duration | Object | number)) The amount to add. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
Returns
DateTime:
Example

```ts
DateTime.now().plus(123) //~> in 123 milliseconds

DateTime.now().plus({ minutes: 15 }) //~> in 15 minutes

DateTime.now().plus({ days: 1 }) //~> this time tomorrow

DateTime.now().plus({ days: -1 }) //~> this time yesterday

DateTime.now().plus({ hours: 3, minutes: 13 }) //~> in 3 hr, 13 min
```

DateTime.now().plus(Duration.fromObject({ hours: 3, minutes: 13 })) //~> in 3 hr, 13 min

▾ minus(duration)

Subtract a period of time to this DateTime and return the resulting DateTime See DateTime#plus
minus(duration: (Duration | Object | number)): DateTime
Parameters
duration ((Duration | Object | number)) The amount to subtract. Either a Luxon Duration, a number of milliseconds, the object argument to Duration.fromObject()
Returns
DateTime:

# Current file structure

```sh
├── README.md
├── components
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── pnpm-lock.yaml
├── public
│ └── vite.svg
├── src
│ ├── App.css
│ ├── App.tsx
│ ├── assets
│ │ └── react.svg
│ ├── components
│ │ ├── DynamicCirclesInBigCircle.tsx
│ │ ├── IntervalGrid.tsx
│ │ ├── TimelineEditor
│ │ ├── ui
│ │ └── useRampIntervalReducer.ts
│ ├── index.css
│ ├── lib
│ │ └── utils.ts
│ ├── main.tsx
│ ├── utils.ts
│ └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```
