# Requirements Document

## Introduction

The Kelem Parent Portal is a Next.js 16 + TypeScript application that allows parents to monitor their children's academic progress, attendance, assignments, grades, messages, and schedules. The current codebase has grown into a monolithic structure where `src/App.tsx` (~3000+ lines) contains all components, mock data, utilities, and business logic in a single file. This makes the codebase difficult to maintain, test, and extend.

This document specifies the requirements for a **pure structural refactoring** of the codebase. The refactoring must decompose the monolith into a well-organized, domain-driven directory structure without altering any existing UI, UX, or runtime behavior. No new features will be added. No existing functionality will be removed or modified.

---

## Glossary

- **Refactoring_Tool**: The automated or manual process that restructures source files according to the target directory layout.
- **App_Component**: The main React component currently defined in `src/App.tsx` that handles sidebar navigation, child selector, mobile navigation, and module routing.
- **Feature_Module**: A self-contained React component responsible for rendering one domain area (e.g., GradesModule, AttendanceModule). Currently co-located in `App.tsx`.
- **Primitive_UI_Component**: A small, reusable, domain-agnostic React component (e.g., `Card`, `Badge`, `SectionLabel`, `SidebarItem`) used across multiple Feature Modules.
- **Grade_Utility**: One of the pure functions `getGradeColor`, `getGradeBg`, or `getGradeLetter` that maps a numeric score to a CSS class string or letter grade.
- **Subject_Utility**: The pure function `getSubjectInitials` that maps a subject name string to a 1–2 character uppercase abbreviation.
- **Mock_Data**: The `children` array and `parentName` constant currently defined at the top of `App.tsx`, representing three student records (Sara, Yonas, and Liya Bekele).
- **Homework_Confirmation_State**: The per-child boolean flag persisted to `localStorage` under the key `homework-confirmed-{childId}`, indicating whether a parent has reviewed today's homework.
- **Path_Alias**: The TypeScript/Next.js import alias `@/` that resolves to a project-relative path, currently mapped to `./*` (project root) and required to be updated to `./src/*`.
- **Target_Structure**: The directory layout defined in the project context, with `src/components/ui/`, `src/components/features/`, `src/hooks/`, `src/lib/`, `src/services/`, `src/store/`, `src/types/`, and `src/styles/`.
- **Gradebook_Task**: A single academic work item that may originate from the `homework` array, the `assignments` array, or an exams collection, combined into a unified list in `GradebookModule`.
- **LocalThreads**: The message thread state managed inside `MessagesModule`, representing the list of teacher–parent conversation threads for the currently selected child.

---

## Requirements

### Requirement 1: Target Directory Structure

**User Story:** As a developer, I want the source code organized into a well-defined domain-driven directory structure, so that I can locate, modify, and test any part of the application without navigating a monolithic file.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL create the following directories under `src/`: `components/ui/`, `components/features/overview/`, `components/features/grades/`, `components/features/attendance/`, `components/features/assignments/`, `components/features/messages/`, `components/features/notifications/`, `components/features/schedule/`, `components/features/analytics/`, `components/features/planner/`, `hooks/`, `lib/`, `services/`, `store/`, `types/`, and `styles/`.
2. THE Refactoring_Tool SHALL preserve the existing `src/app/` directory and its files (`page.tsx`, `layout.tsx`, `client.tsx`) without modification.
3. THE Refactoring_Tool SHALL move `src/index.css` to `src/styles/globals.css` and update all import references to reflect the new path.
4. WHEN the refactoring is complete, THE Refactoring_Tool SHALL ensure no source files remain directly under `src/` except those required by Next.js App Router conventions.

---

### Requirement 2: Path Alias Configuration

**User Story:** As a developer, I want the `@/` import alias to resolve to `src/`, so that all imports use consistent, root-relative paths that do not break when files are moved between subdirectories.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL update `tsconfig.json` to change the `paths` entry for `@/*` from `["./*"]` to `["./src/*"]`.
2. THE Refactoring_Tool SHALL update `next.config.mjs` to include a `webpack` alias or equivalent configuration that maps `@/` to `./src/` for runtime module resolution.
3. WHEN the path alias is updated, THE Refactoring_Tool SHALL replace all existing relative import paths (e.g., `../`, `./`) in moved files with `@/`-prefixed absolute paths.
4. IF a file uses a relative import that crosses a directory boundary after the refactoring, THEN THE Refactoring_Tool SHALL replace that import with the equivalent `@/`-prefixed path.

---

### Requirement 3: Primitive UI Component Extraction

**User Story:** As a developer, I want the primitive UI components (`Card`, `Badge`, `SectionLabel`, `SidebarItem`) extracted into `src/components/ui/`, so that they can be imported and reused across all feature modules without circular dependencies.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL extract the `Card` component from `App.tsx` and create `src/components/ui/Card.tsx` containing only the `Card` component definition and its TypeScript props interface.
2. THE Refactoring_Tool SHALL extract the `Badge` component from `App.tsx` and create `src/components/ui/Badge.tsx` containing only the `Badge` component definition and its TypeScript props interface.
3. THE Refactoring_Tool SHALL extract the `SectionLabel` component from `App.tsx` and create `src/components/ui/SectionLabel.tsx` containing only the `SectionLabel` component definition and its TypeScript props interface.
4. THE Refactoring_Tool SHALL extract the `SidebarItem` component from `App.tsx` and create `src/components/ui/SidebarItem.tsx` containing only the `SidebarItem` component definition and its TypeScript props interface.
5. THE Refactoring_Tool SHALL create `src/components/ui/index.ts` that re-exports all four primitive UI components.
6. WHEN `AnalyticsModule.tsx` defines its own local `Card` and `SectionLabel` components, THE Refactoring_Tool SHALL remove those local definitions and replace their usages with imports from `@/components/ui`.
7. THE Refactoring_Tool SHALL ensure no primitive UI component file exceeds 150 lines.

---

### Requirement 4: Shared TypeScript Type Definitions

**User Story:** As a developer, I want all shared TypeScript interfaces and types in `src/types/`, so that every module references a single source of truth for data shapes and there are no duplicate or conflicting type definitions.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL create `src/types/child.ts` containing the `Child` interface that describes the full student record shape (id, name, initials, grade, section, overallAvg, attendance, assignmentsDue, missingWork, subjects, attendance_log, homework, assignments, messages, notifications, schedule).
2. THE Refactoring_Tool SHALL create `src/types/assignment.ts` containing the `Assignment` interface and the `Homework` interface.
3. THE Refactoring_Tool SHALL create `src/types/message.ts` containing the `Message` interface and the `ThreadEntry` interface.
4. THE Refactoring_Tool SHALL create `src/types/notification.ts` containing the `Notification` interface.
5. THE Refactoring_Tool SHALL create `src/types/schedule.ts` containing the `ScheduleEntry` interface and the `Subject` interface.
6. THE Refactoring_Tool SHALL create `src/types/index.ts` that re-exports all types from the above files.
7. WHEN a Feature_Module or utility function references a data shape, THE Refactoring_Tool SHALL import that shape from `@/types` rather than defining it inline.
8. THE Refactoring_Tool SHALL remove all duplicate inline interface definitions from `AttendanceView.tsx` and `AnalyticsModule.tsx` that overlap with the canonical types in `src/types/`.

---

### Requirement 5: Grade and Subject Utility Extraction

**User Story:** As a developer, I want the grade and subject utility functions in `src/lib/`, so that they are pure, independently testable functions with a single canonical implementation used by all modules.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL create `src/lib/gradeUtils.ts` containing the canonical implementations of `getGradeColor`, `getGradeBg`, and `getGradeLetter`.
2. THE Refactoring_Tool SHALL create `src/lib/subjectUtils.ts` containing the canonical implementation of `getSubjectInitials`.
3. THE Refactoring_Tool SHALL create `src/lib/index.ts` that re-exports all utility functions from the above files.
4. WHEN `AnalyticsModule.tsx` defines its own local `getGradeLetter` and `getGradeColorClass` functions, THE Refactoring_Tool SHALL remove those local definitions and replace their usages with imports from `@/lib/gradeUtils`.
5. THE Refactoring_Tool SHALL ensure the canonical `getGradeColor` function returns `"text-emerald-600"` for scores ≥ 75, `"text-amber-600"` for scores ≥ 50 and < 75, and `"text-red-600"` for scores < 50.
6. THE Refactoring_Tool SHALL ensure the canonical `getGradeBg` function returns the corresponding Tailwind background+text+border class string for the same three score ranges.
7. THE Refactoring_Tool SHALL ensure the canonical `getGradeLetter` function returns `"A"` for scores ≥ 90, `"B"` for scores ≥ 80, `"C"` for scores ≥ 70, `"D"` for scores ≥ 60, and `"F"` for scores < 60.

#### Correctness Properties

- **Grade utility exhaustiveness**: FOR ALL integer scores in the range [0, 100], `getGradeColor` SHALL return exactly one of `"text-emerald-600"`, `"text-amber-600"`, or `"text-red-600"`.
- **Grade utility exhaustiveness**: FOR ALL integer scores in the range [0, 100], `getGradeLetter` SHALL return exactly one of `"A"`, `"B"`, `"C"`, `"D"`, or `"F"`.
- **Grade utility boundary consistency**: FOR ALL integer scores in the range [0, 100], the color tier returned by `getGradeColor` SHALL be consistent with the background tier returned by `getGradeBg` (i.e., both SHALL agree on which of the three tiers applies for any given score).
- **Grade utility monotonicity**: FOR ALL integer scores `s1` and `s2` where `s1 < s2`, the grade letter returned by `getGradeLetter(s1)` SHALL be less than or equal to `getGradeLetter(s2)` in the ordering F < D < C < B < A.
- **Subject initials bounds**: FOR ALL non-empty subject name strings, `getSubjectInitials` SHALL return a string of length 1 or 2 consisting entirely of uppercase ASCII letters.
- **Canonical equivalence**: FOR ALL integer scores in the range [0, 100], the canonical `getGradeLetter` in `src/lib/gradeUtils.ts` SHALL return the same value as the previously duplicated `getGradeLetter` in `AnalyticsModule.tsx`.

---

### Requirement 6: Mock Data and Constants Extraction

**User Story:** As a developer, I want the mock data (`children` array, `parentName`) and the `homeworkMap` extracted into `src/lib/`, so that data concerns are separated from rendering logic and can be replaced with real API calls in the future.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL create `src/lib/mockData.ts` containing the `children` array and the `parentName` constant, exported as named exports.
2. THE Refactoring_Tool SHALL move the `homeworkMap` record from inside `OverviewModule` into `src/lib/mockData.ts` as a named export.
3. THE Refactoring_Tool SHALL ensure `src/lib/mockData.ts` imports the `Child` type from `@/types` and types the `children` array as `Child[]`.
4. WHEN `App_Component` or any Feature_Module references `children` or `parentName`, THE Refactoring_Tool SHALL replace those references with imports from `@/lib/mockData`.

---

### Requirement 7: Custom Hook Extraction

**User Story:** As a developer, I want all non-rendering stateful logic extracted into custom React hooks in `src/hooks/`, so that components remain focused on rendering and business logic is independently testable.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL create `src/hooks/useHomeworkConfirmation.ts` containing the `useHomeworkConfirmation` hook, which encapsulates the `localStorage` read on mount, the `isConfirmed` state, the `handleConfirm` function, and the reset function.
2. THE `useHomeworkConfirmation` hook SHALL accept a `childId` string parameter and SHALL use the key `homework-confirmed-{childId}` for `localStorage` operations.
3. THE Refactoring_Tool SHALL create `src/hooks/useMessageThreads.ts` containing the `useMessageThreads` hook, which encapsulates the `localThreads` state and the reply-sending logic currently inside `MessagesModule`.
4. THE Refactoring_Tool SHALL create `src/hooks/index.ts` that re-exports all custom hooks.
5. WHEN `OverviewModule` uses inline `localStorage` logic for homework confirmation, THE Refactoring_Tool SHALL replace that logic with a call to `useHomeworkConfirmation`.
6. WHEN `MessagesModule` manages `localThreads` state inline, THE Refactoring_Tool SHALL replace that logic with a call to `useMessageThreads`.

#### Correctness Properties

- **Homework confirmation round-trip**: FOR ALL valid `childId` strings, calling `handleConfirm()` from `useHomeworkConfirmation(childId)` and then reading `localStorage.getItem("homework-confirmed-{childId}")` SHALL return `"true"`.
- **Homework confirmation reset**: FOR ALL valid `childId` strings, calling the reset function from `useHomeworkConfirmation(childId)` after confirming SHALL set `isConfirmed` to `false` and SHALL remove the key from `localStorage`.
- **Homework confirmation isolation**: FOR ALL pairs of distinct `childId` strings `id1` and `id2`, confirming homework for `id1` SHALL NOT affect the confirmation state for `id2`.
- **Message thread append**: FOR ALL initial thread states and non-empty reply text strings, calling the send-reply function from `useMessageThreads` SHALL increase the thread length by exactly 1.
- **Message thread sender**: FOR ALL non-empty reply text strings, the last entry in the thread after calling send-reply SHALL have `sender` equal to `"parent"` and `text` equal to the sent string.

---

### Requirement 8: Feature Module Extraction

**User Story:** As a developer, I want each Feature_Module extracted into its own file under `src/components/features/{domain}/`, so that each domain area is independently navigable, modifiable, and testable.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL create `src/components/features/overview/OverviewModule.tsx` containing the `OverviewModule` component, importing `useHomeworkConfirmation` from `@/hooks`, `homeworkMap` from `@/lib/mockData`, and Primitive_UI_Components from `@/components/ui`.
2. THE Refactoring_Tool SHALL create `src/components/features/grades/GradesModule.tsx` containing the `GradesModule` component and its slide-in drawer sub-component.
3. THE Refactoring_Tool SHALL create `src/components/features/grades/GradebookModule.tsx` containing the `GradebookModule` component, including the search/filter logic, mobile card view, desktop table view, and grade detail modal.
4. THE Refactoring_Tool SHALL create `src/components/features/attendance/AttendanceModule.tsx` as a thin wrapper that imports and renders `AttendanceView` from `@/components/features/attendance/AttendanceView`.
5. THE Refactoring_Tool SHALL move `src/AttendanceView.tsx` to `src/components/features/attendance/AttendanceView.tsx` and update all import references.
6. THE Refactoring_Tool SHALL create `src/components/features/assignments/AssignmentsModule.tsx` containing the `AssignmentsModule` component and its filter logic.
7. THE Refactoring_Tool SHALL create `src/components/features/messages/MessagesModule.tsx` containing the `MessagesModule` component, importing `useMessageThreads` from `@/hooks`.
8. THE Refactoring_Tool SHALL create `src/components/features/notifications/NotificationsModule.tsx` containing the `NotificationsModule` component.
9. THE Refactoring_Tool SHALL create `src/components/features/schedule/ScheduleModule.tsx` containing the `ScheduleModule` component.
10. THE Refactoring_Tool SHALL move `src/AnalyticsModule.tsx` to `src/components/features/analytics/AnalyticsModule.tsx` and update all import references.
11. THE Refactoring_Tool SHALL create `src/components/features/planner/PlannerModule.tsx` containing the weekly timetable and academic calendar modal components referenced in `App.tsx`.
12. WHEN a Feature_Module file exceeds 150 lines, THE Refactoring_Tool SHALL split it into sub-components within the same feature domain directory.
13. THE Refactoring_Tool SHALL create a `src/components/features/{domain}/index.ts` barrel file for each feature domain that re-exports the domain's primary component.

---

### Requirement 9: Main App Component Refactoring

**User Story:** As a developer, I want the main `App` component in `src/App.tsx` reduced to only sidebar navigation, child selector, mobile navigation, and module routing logic, so that it is a thin orchestrator with no embedded feature or utility code.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL retain `src/App.tsx` as the main application shell, containing only the sidebar, child selector, mobile navigation bar, and the conditional rendering switch that maps the active module name to the corresponding Feature_Module component.
2. WHEN all Feature_Modules, Primitive_UI_Components, utilities, and data have been extracted, THE Refactoring_Tool SHALL ensure `src/App.tsx` does not exceed 150 lines.
3. THE Refactoring_Tool SHALL ensure `src/App.tsx` imports all Feature_Modules using `@/`-prefixed paths.
4. THE Refactoring_Tool SHALL ensure `src/app/client.tsx` continues to dynamically import `App` from `@/App` (or the updated path) without modification to the dynamic import pattern.

---

### Requirement 10: Assignment Filtering Correctness

**User Story:** As a developer, I want the assignment filtering logic in `AssignmentsModule` to be correct and verifiable, so that parents always see an accurate, consistent subset of assignments matching their selected filter.

#### Acceptance Criteria

1. THE `AssignmentsModule` SHALL accept a `filter` prop or manage an internal filter state representing the currently selected status or type category.
2. WHEN a filter is applied, THE `AssignmentsModule` SHALL display only assignments whose status or type matches the selected filter value.
3. WHEN the filter is set to "All", THE `AssignmentsModule` SHALL display all assignments without exclusion.

#### Correctness Properties

- **Filter subset**: FOR ALL assignment arrays and filter values, the filtered result SHALL be a subset of the original array (no items appear in the result that were not in the input).
- **Filter idempotence**: FOR ALL assignment arrays and filter values, applying the same filter twice SHALL return the same result as applying it once.
- **Filter completeness for "All"**: FOR ALL assignment arrays, applying the "All" filter SHALL return an array of the same length as the input array.
- **Filter correctness**: FOR ALL assignment arrays and non-"All" filter values, every item in the filtered result SHALL satisfy the filter predicate.

---

### Requirement 11: Gradebook Task Aggregation Correctness

**User Story:** As a developer, I want the gradebook task aggregation logic to produce a deduplicated, complete list of tasks, so that parents see every academic work item exactly once.

#### Acceptance Criteria

1. THE `GradebookModule` SHALL combine the `homework` array, the `assignments` array, and any exams collection into a single unified `Gradebook_Task` list for display.
2. THE `GradebookModule` SHALL use the `id` field of each item as the deduplication key when combining arrays.
3. IF a `Gradebook_Task` with a given `id` appears in more than one source array, THEN THE `GradebookModule` SHALL include that task exactly once in the combined list.

#### Correctness Properties

- **No duplicate IDs**: FOR ALL combinations of homework, assignment, and exam arrays, the combined Gradebook_Task list SHALL contain no two items with the same `id`.
- **No items dropped**: FOR ALL combinations of homework, assignment, and exam arrays where all IDs are unique, the combined list length SHALL equal the sum of the individual array lengths.
- **Source completeness**: FOR ALL items in any source array, that item SHALL appear in the combined list.

---

### Requirement 12: Services Directory Structure

**User Story:** As a developer, I want a `src/services/` directory with placeholder service modules, so that future API integration has a defined location and pattern to follow without requiring changes to the component layer.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL create `src/services/childService.ts` with a placeholder `getChildren` function that currently returns the `children` mock data from `@/lib/mockData` and is typed to return `Promise<Child[]>`.
2. THE Refactoring_Tool SHALL create `src/services/index.ts` that re-exports all service functions.
3. THE `childService.ts` file SHALL include a comment indicating that the mock data return is a temporary placeholder to be replaced with a real API call.
4. THE Refactoring_Tool SHALL ensure no component directly imports from `@/lib/mockData` for the `children` array; all child data access SHALL go through `@/services/childService`.

---

### Requirement 13: Incremental Refactoring Order

**User Story:** As a developer, I want the refactoring performed in a defined incremental order, so that the application remains buildable and runnable after each step and regressions can be identified immediately.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL perform the refactoring in the following order: (1) create directory structure, (2) update path alias, (3) extract types, (4) extract utilities, (5) extract mock data, (6) extract primitive UI components, (7) extract custom hooks, (8) extract feature modules one domain at a time, (9) slim down `App.tsx`, (10) create services placeholders.
2. AFTER each step in the incremental order, THE Refactoring_Tool SHALL verify that `next build` completes without TypeScript errors or module resolution failures.
3. IF `next build` fails after any step, THEN THE Refactoring_Tool SHALL revert only the changes from that step and report the failure before proceeding.
4. THE Refactoring_Tool SHALL not modify any Tailwind CSS class names, animation parameters, or JSX structure during the refactoring.

---

### Requirement 14: Zero Behavioral Regression

**User Story:** As a developer, I want the refactored application to be functionally identical to the original, so that no parent-facing functionality is broken by the structural changes.

#### Acceptance Criteria

1. THE Refactoring_Tool SHALL not add, remove, or modify any rendered HTML elements, Tailwind CSS classes, Framer Motion animation props, or event handler logic.
2. THE Refactoring_Tool SHALL not change the props interface of any component that is rendered by `App_Component` or `src/app/client.tsx`.
3. WHEN the refactored application is loaded in a browser, THE App_Component SHALL render the same initial UI state as the original application for each of the three mock children.
4. THE Refactoring_Tool SHALL preserve the `html2canvas` and `jsPDF` download functionality in the modules that use it, without moving those calls to a different execution context.
5. THE Refactoring_Tool SHALL preserve the `localStorage`-based `Homework_Confirmation_State` behavior, including the per-child key pattern `homework-confirmed-{childId}`, the initial read on mount, and the reset function.
