# Research: Drag-and-Drop Accessibility & RTL Responsive Kanban

This research document details the technical layout decisions, accessibility patterns, and database behavior chosen for Feature 005 (Sales Pipeline Board).

---

## 1. Accessible Drag-and-Drop Approach

### Context
Standard HTML5 drag-and-drop APIs only support pointer inputs (mouse/trackpad) and do not support keyboard navigation or touch screens (mobile/tablet). To satisfy **Principle IX (Responsive & Accessible)** of the NEBRASGOO Constitution, the kanban board must support keyboard-only and screen-reader users.

### Decision
Implement a hybrid approach:
- **Pointer/Desktop**: Native HTML5 Drag and Drop or a simple wrapper to move cards between columns.
- **Keyboard/Mobile Fallback**: Provide an explicit, visible options button (three dots menu or similar) on each card. Clicking this button opens a dropdown/menu listing the other six stages as options (e.g., "نقل إلى: مهتم").
- **Accessibility features**:
  - Focusable interactive elements on cards (keyboard tab-navigable).
  - Appropriate ARIA roles (`role="grid"`, `role="row"`, `role="gridcell"` or similar listbox wrappers).
  - Dynamic announcement of status changes using an ARIA live region (`role="status"` or `aria-live="polite"`).

### Rationale
Using a Tap Menu fallback avoids heavy dependencies like `react-beautiful-dnd` (which is deprecated and has issues with React 18 concurrent rendering) or `@hello-pangea/dnd`. The menu fallback is 100% reliable on both mobile and screen readers, ensuring simple, lightweight, and robust accessibility.

---

## 2. Mobile Layout & Swipe Navigation in RTL

### Context
A 7-column kanban board cannot fit on mobile screens (<700px) without collapsing into unreadable tiny vertical strips.

### Decision
- **Layout**: Under 700px viewport, display a swipeable/scrollable horizontal tab header at the top showing the 7 stages in RTL order (جديد, تم الاتصال, مهتم, تقديم عرض, تفاوض, تعاقد, خاسرة).
- **Column View**: Only the column of the currently active tab is displayed (taking 100% of the viewport width).
- **Interaction**: Users swipe horizontally or tap the tabs to switch columns. Card movement is performed exclusively via the tap menu on the card, as drag-and-drop is disabled on mobile viewports.
- **Counts**: The tab headers display the count badge next to the stage name (e.g., "جديد (12)") so users can see active counts at a glance.

---

## 3. Database Schema: Lost Reason and Timestamps

### Context
We need to capture why a lead is "lost" to support later analytics (Feature 012). We also need to sort cards in each column by their most recent activity.

### Decision
- **Lost Reason Enum**: Create a PostgreSQL enum type `lost_reason_type` containing:
  - `price` (السعر)
  - `competitor` (المنافس)
  - `no_response` (عدم الرد)
  - `not_interested` (غير مهتم)
  - `other` (أخرى)
- **Field Addition**: Add a nullable `lost_reason` field of type `lost_reason_type` on the `facilities` table.
- **Timeline Integration**: The Server Action that updates status will append the `lost_reason` to the `FacilityActivity` log's `new_value` or a dedicated field in the log. We will format it as `"lost: <reason>"` or store it in `new_value` so that it appears in the timeline (e.g., "تم استبعاد المنشأة بسبب السعر").
- **Status Change Timestamp**: Add a `status_changed_at` timestamp column to `facilities` that defaults to `now()`. Write a database trigger that updates `status_changed_at = now()` whenever `lifecycle_status` is updated.
- **Card Ordering**: Columns query facilities filtering by `lifecycle_status` and sorting by `status_changed_at DESC` (or `updated_at DESC`).
