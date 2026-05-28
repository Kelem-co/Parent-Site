# Implementation Plan: Next.js Codebase Refactor

## Overview

This plan decomposes the monolithic `src/App.tsx` (~3000+ lines) into a domain-driven directory structure without changing any UI, UX, or runtime behavior. Tasks follow the incremental refactoring order defined in Requirement 13, with a build verification gate after each step. Property-based tests using fast-check + vitest are included for all correctness properties defined in the design document.

## Current State Assessment

Before executing tasks, note what has already been partially completed:

- `src/types/index.ts` — all shared types exist (Child, Subject, HomeworkEntry, AssignmentEntry, MessageEntry, NotificationEntry, ScheduleEntry, Student, AttendanceLogEntry)
- `src/lib/utils.ts` — all grade/subject utilities exist (getGradeColor, getGradeBg, getGradeLetter, getGradeColorClass, getProgressBarColor, getSubjectInitials)
- `src/lib/constants.ts` — CHILDREN and PARENT_NAME exist; HOMEWORK_MAP is still inline in OverviewModule
- `src/components/ui/` — Card, Badge, SectionLabel, SidebarItem, index.ts all exist
- `src/components/features/` — flat-level extractions exist (GradesModule, GradebookModule, AssignmentsModule, MessagesModule, OverviewModule, AttendanceView, LogAbsenceModal, AnalyticsModule) but are NOT yet organized into domain subdirectories
- `src/hooks/` — does NOT exist yet
- `src/services/` — does NOT exist yet
- `src/lib/mockData.ts` — does NOT exist yet (data is in constants.ts)
- `src/lib/gradeUtils.ts` / `src/lib/subjectUtils.ts` — do NOT exist yet (utils are in utils.ts)
- vitest / fast-check — NOT installed yet
- `src/App.tsx` — still monolithic (~3000 lines), not yet slimmed down

---

## Tasks

- [x] 1. Finalize directory structure and CSS migration
  - [x] 1.1 Create all missing target directories: `src/components/features/overview/`, `src/components/features/grades/`, `src/components/features/attendance/`, `src/components/features/assignments/`, `src/components/features/messages/`, `src/components/features/notifications/`, `src/components/features/schedule/`, `src/components/features/analytics/`, `src/components/features/planner/`, `src/hooks/`, `src/services/`, `src/store/`, `src/styles/`
  - [x] 1.2 Move `src/index.css` to `src/styles/globals.css`
  - [x] 1.3 Update the CSS import in `src/app/layout.tsx` from `'../index.css'` to `'@/styles/globals.css'`
  - [x] 1.4 Run `next build` and verify it passes with no errors

- [x] 2. Verify and lock path alias configuration
  - [x] 2.1 Confirm `tsconfig.json` has `"@/*": ["./src/*"]` (already set); if it reads `["./*"]` update it to `["./src/*"]`
  - [x] 2.2 Confirm `next.config.mjs` requires no webpack alias (Next.js 16 resolves `@/` natively from tsconfig); add a comment documenting this
  - [x] 2.3 Audit all existing files in `src/components/features/` and `src/components/ui/` for any relative cross-directory imports and replace them with `@/`-prefixed paths
  - [x] 2.4 Run `next build` and verify it passes with no errors

- [x] 3. Canonicalize type definitions
  - [x] 3.1 Split `src/types/index.ts` into separate files: `src/types/child.ts` (Child, Subject, AttendanceLogEntry, Student), `src/types/assignment.ts` (HomeworkEntry, AssignmentEntry), `src/types/message.ts` (MessageEntry, ThreadMessage, MessageThread), `src/types/notification.ts` (NotificationEntry), `src/types/schedule.ts` (ScheduleEntry)
  - [x] 3.2 Update `src/types/index.ts` to re-export all types from the above files using `export * from './child'` etc.
  - [x] 3.3 Remove any remaining duplicate inline interface definitions from `src/AttendanceView.tsx` and `src/AnalyticsModule.tsx` (the Student and AnalyticsModuleProps inline types) and replace with imports from `@/types`
  - [x] 3.4 Run `next build` and verify it passes with no type errors

- [x] 4. Canonicalize utility functions
  - [x] 4.1 Create `src/lib/gradeUtils.ts` by extracting `getGradeColor`, `getGradeBg`, `getGradeLetter`, `getGradeColorClass`, and `getProgressBarColor` from `src/lib/utils.ts` into the new file with proper JSDoc comments matching the design spec
  - [x] 4.2 Create `src/lib/subjectUtils.ts` by extracting `getSubjectInitials` from `src/lib/utils.ts` into the new file
  - [x] 4.3 Update `src/lib/utils.ts` to re-export everything from `gradeUtils.ts` and `subjectUtils.ts` (for backward compatibility during migration), or update all existing consumers to import from the canonical files directly
  - [x] 4.4 Update `src/lib/index.ts` (create if absent) to re-export all utilities from `gradeUtils`, `subjectUtils`, and `mockData` (once created)
  - [x] 4.5 Remove local `getGradeLetter`, `getGradeColorClass`, and `getProgressBarColor` definitions from `src/AnalyticsModule.tsx` and replace with imports from `@/lib/gradeUtils`
  - [x] 4.6 Run `next build` and verify it passes with no duplicate function definition errors

- [x] 5. Extract mock data to `src/lib/mockData.ts`
  - [x] 5.1 Create `src/lib/mockData.ts` exporting `CHILDREN: Child[]`, `PARENT_NAME: string`, and `HOMEWORK_MAP: Record<string, HomeworkItem[]>` with the `HomeworkItem` interface defined in the same file; import `Child` from `@/types`
  - [x] 5.2 Move the `CHILDREN` array and `PARENT_NAME` constant from `src/lib/constants.ts` into `src/lib/mockData.ts` (keep `constants.ts` as a re-export shim or delete it after updating all consumers)
  - [x] 5.3 Move the `homeworkMap` record from inside `OverviewModule` in `src/components/features/OverviewModule.tsx` into `src/lib/mockData.ts` as `HOMEWORK_MAP`
  - [x] 5.4 Update `src/components/features/OverviewModule.tsx` to import `HOMEWORK_MAP` from `@/lib/mockData` instead of defining it inline
  - [x] 5.5 Update `src/lib/index.ts` to include `export * from './mockData'`
  - [x] 5.6 Run `next build` and verify it passes; confirm the app renders all three children correctly

- [ ] 6. Verify primitive UI components are complete and correct
  - [x] 6.1 Confirm `src/components/ui/Card.tsx`, `Badge.tsx`, `SectionLabel.tsx`, `SidebarItem.tsx`, and `index.ts` all exist and match the interface signatures in the design document
  - [x] 6.2 Remove local `Card` and `SectionLabel` definitions from `src/AnalyticsModule.tsx` (the root-level file) and replace with imports from `@/components/ui`
  - [x] 6.3 Verify `src/App.tsx` still defines its own local `Card`, `Badge`, `SectionLabel`, `SidebarItem` — these will be removed in Step 9 when App.tsx is slimmed; for now just confirm the `@/components/ui` versions are correct
  - [ ] 6.4 Run `next build` and verify it passes

- [ ] 7. Extract custom hooks
  - [ ] 7.1 Create `src/hooks/useHomeworkConfirmation.ts` implementing the `useHomeworkConfirmation(childId: string)` hook with `isConfirmed`, `handleConfirm`, and `resetConfirmation` as specified in the design document; wrap all `localStorage` calls in try/catch with SSR guard (`typeof window !== 'undefined'`)
  - [ ] 7.2 Update `src/components/features/OverviewModule.tsx` to replace its inline `localStorage` state logic with a call to `useHomeworkConfirmation(child.id)` imported from `@/hooks`
  - [ ] 7.3 Create `src/hooks/useMessageThreads.ts` implementing the `useMessageThreads()` hook that encapsulates the `localThreads` static dataset, `threads` state, `handleSend`, `filteredThreads`, `searchTerm`, `replyText`, and `selectedIdx` as specified in the design document
  - [ ] 7.4 Update `src/components/features/MessagesModule.tsx` to replace its inline thread state and `handleSend` logic with a call to `useMessageThreads()` imported from `@/hooks`
  - [ ] 7.5 Create `src/hooks/index.ts` re-exporting `useHomeworkConfirmation` and `useMessageThreads`
  - [ ] 7.6 Run `next build` and verify it passes; manually verify homework confirmation and message reply still work

- [ ] 8. Reorganize feature modules into domain subdirectories
  - [ ] 8.1 Overview domain: move `src/components/features/OverviewModule.tsx` to `src/components/features/overview/OverviewModule.tsx`; create `src/components/features/overview/index.ts` re-exporting `OverviewModule`; update all import references in `src/App.tsx`
  - [ ] 8.2 Grades domain: move `src/components/features/GradesModule.tsx` to `src/components/features/grades/GradesModule.tsx`; move `src/components/features/GradebookModule.tsx` to `src/components/features/grades/GradebookModule.tsx`; create `src/components/features/grades/index.ts` re-exporting both; update all import references
  - [ ] 8.3 Attendance domain: move `src/components/features/AttendanceView.tsx` to `src/components/features/attendance/AttendanceView.tsx`; move `src/components/features/LogAbsenceModal.tsx` to `src/components/features/attendance/LogAbsenceModal.tsx`; create `src/components/features/attendance/AttendanceModule.tsx` as a thin wrapper that maps `Child` to `Student` and renders `<AttendanceView>`; create `src/components/features/attendance/index.ts` re-exporting `AttendanceModule`; update all import references; also move `src/AttendanceView.tsx` (root-level) if it still exists
  - [ ] 8.4 Assignments domain: move `src/components/features/AssignmentsModule.tsx` to `src/components/features/assignments/AssignmentsModule.tsx`; ensure `filterAssignments` is exported as a named pure function; create `src/components/features/assignments/index.ts`; update all import references
  - [ ] 8.5 Messages domain: move `src/components/features/MessagesModule.tsx` to `src/components/features/messages/MessagesModule.tsx`; create `src/components/features/messages/index.ts`; update all import references
  - [ ] 8.6 Notifications domain: move `src/components/features/NotificationsModule.tsx` (or extract from App.tsx if not yet extracted) to `src/components/features/notifications/NotificationsModule.tsx`; create `src/components/features/notifications/index.ts`; update all import references
  - [ ] 8.7 Schedule domain: move or extract `ScheduleModule` to `src/components/features/schedule/ScheduleModule.tsx`; create `src/components/features/schedule/index.ts`; update all import references
  - [ ] 8.8 Analytics domain: move `src/AnalyticsModule.tsx` (root-level) to `src/components/features/analytics/AnalyticsModule.tsx`; update all import references including the one in `src/App.tsx`; create `src/components/features/analytics/index.ts`
  - [ ] 8.9 Planner domain: extract `PlannerModule` from `src/App.tsx` into `src/components/features/planner/PlannerModule.tsx`; create `src/components/features/planner/index.ts`; update `src/App.tsx` to import from `@/components/features/planner`
  - [ ] 8.10 Run `next build` after each sub-step (8.1 through 8.9) and verify it passes before proceeding to the next sub-step

- [ ] 9. Slim down `src/App.tsx`
  - [ ] 9.1 Remove all feature component definitions (OverviewModule, GradesModule, GradebookModule, AttendanceModule, AssignmentsModule, MessagesModule, NotificationsModule, ScheduleModule, AnalyticsModule, PlannerModule) from `src/App.tsx` and replace with imports from `@/components/features/{domain}`
  - [ ] 9.2 Remove all primitive UI component definitions (Card, Badge, SectionLabel, SidebarItem) from `src/App.tsx` and replace with imports from `@/components/ui`
  - [ ] 9.3 Remove all utility function definitions (getGradeColor, getGradeBg, getGradeLetter) from `src/App.tsx` and replace with imports from `@/lib/gradeUtils`
  - [ ] 9.4 Remove the `children` array and `parentName` constant from `src/App.tsx`; update `App.tsx` to call `getChildren()` from `@/services/childService` (which will be created in Task 10) or import `CHILDREN` from `@/lib/mockData` as a temporary measure
  - [ ] 9.5 Remove the `homeworkMap` from `src/App.tsx` if any remnant exists (it should already be in `@/lib/mockData`)
  - [ ] 9.6 Verify `src/App.tsx` is ≤ 150 lines and contains only: state declarations, sidebar nav items array, child selector dropdown JSX, mobile bottom nav bar JSX, and the module routing switch
  - [ ] 9.7 Verify `src/app/client.tsx` dynamic import still resolves (`import('../App')` or `import('@/App')`)
  - [ ] 9.8 Run `next build` and verify it passes; verify the app renders correctly for all three children

- [ ] 10. Create services layer
  - [ ] 10.1 Create `src/services/childService.ts` with an async `getChildren(): Promise<Child[]>` function that returns `Promise.resolve(CHILDREN)` from `@/lib/mockData`; include a TODO comment indicating this should be replaced with a real API call
  - [ ] 10.2 Create `src/services/index.ts` re-exporting `getChildren` from `./childService`
  - [ ] 10.3 Update `src/App.tsx` to call `getChildren()` from `@/services/childService` instead of importing `CHILDREN` directly from `@/lib/mockData`; use `useEffect` + `useState` to load children asynchronously
  - [ ] 10.4 Audit all components to ensure none import `CHILDREN` directly from `@/lib/mockData`; all child data access must go through `@/services/childService`
  - [ ] 10.5 Run `next build` and verify it passes; verify the app loads children data correctly

- [ ] 11. Install property-based testing dependencies
  - [ ] 11.1 Install `fast-check`, `vitest`, and `@vitest/coverage-v8` as dev dependencies: `npm install --save-dev fast-check vitest @vitest/coverage-v8 @vitest/ui`
  - [ ] 11.2 Create `vitest.config.ts` at the project root configuring the test environment as `jsdom`, including `src/**/*.test.ts` and `src/**/*.test.tsx` in the test glob, and setting up coverage for `src/lib/` and `src/hooks/`
  - [ ] 11.3 Add a `"test"` script to `package.json`: `"test": "vitest run"` and `"test:watch": "vitest"`
  - [ ] 11.4 Verify vitest runs without errors on an empty test suite

- [ ] 12. Write property-based tests for grade utilities
  - [ ] 12.1 Create `src/lib/gradeUtils.test.ts`
  - [ ] 12.2 Write Property 1 — Grade color exhaustiveness: for any integer score in [0, 100], `getGradeColor` returns exactly one of `"text-emerald-600"`, `"text-amber-600"`, or `"text-red-600"` (validates Requirements 5.5)
  - [ ] 12.3 Write Property 2 — Grade letter exhaustiveness: for any integer score in [0, 100], `getGradeLetter` returns exactly one of `"A"`, `"B"`, `"C"`, `"D"`, or `"F"` (validates Requirements 5.7)
  - [ ] 12.4 Write Property 3 — Grade utility tier consistency: for any integer score in [0, 100], the color tier from `getGradeColor` is consistent with the background tier from `getGradeBg` — both agree on emerald/amber/red (validates Requirements 5.5 boundary consistency)
  - [ ] 12.5 Write Property 4 — Grade letter monotonicity: for any pair of integer scores `s1 < s2` in [0, 100], `getGradeLetter(s1)` ≤ `getGradeLetter(s2)` in the ordering F < D < C < B < A (validates Requirements 5.5 monotonicity)
  - [ ] 12.6 Write Property 5 — Subject initials bounds: for any non-empty subject name string, `getSubjectInitials` returns a string of length 1 or 2 consisting entirely of uppercase ASCII letters A–Z (validates Requirements 5.5 subject initials bounds)
  - [ ] 12.7 Run `vitest run src/lib/gradeUtils.test.ts` and verify all 5 properties pass

- [ ] 13. Write property-based tests for `useHomeworkConfirmation`
  - [ ] 13.1 Create `src/hooks/useHomeworkConfirmation.test.ts`
  - [ ] 13.2 Set up a localStorage mock/stub using `vitest`'s `vi.stubGlobal` or a custom in-memory implementation to enable testing without a real browser
  - [ ] 13.3 Write Property 6 — Homework confirmation round-trip: for any valid `childId` string, calling `handleConfirm()` sets `isConfirmed` to `true` and writes `"true"` to `localStorage` under key `homework-confirmed-{childId}` (validates Requirements 7.1)
  - [ ] 13.4 Write Property 7 — Homework confirmation reset: for any valid `childId` string, calling `resetConfirmation()` after `handleConfirm()` sets `isConfirmed` to `false` and removes the key from `localStorage` (validates Requirements 7.2)
  - [ ] 13.5 Write Property 8 — Homework confirmation isolation: for any pair of distinct `childId` strings `id1` and `id2`, confirming homework for `id1` does not change the `isConfirmed` state or `localStorage` key for `id2` (validates Requirements 7.3)
  - [ ] 13.6 Run `vitest run src/hooks/useHomeworkConfirmation.test.ts` and verify all 3 properties pass

- [ ] 14. Write property-based tests for `useMessageThreads`
  - [ ] 14.1 Create `src/hooks/useMessageThreads.test.ts`
  - [ ] 14.2 Write Property 9 — Message thread append and sender correctness: for any initial thread state and non-empty reply text string, calling `handleSend` increases the total message count in the current thread by exactly 1, and the appended message has `sender === "parent"` and `text` equal to the sent string (validates Requirements 7.4 and 7.5)
  - [ ] 14.3 Run `vitest run src/hooks/useMessageThreads.test.ts` and verify the property passes

- [ ] 15. Write property-based tests for `filterAssignments`
  - [ ] 15.1 Create `src/components/features/assignments/filterAssignments.test.ts`
  - [ ] 15.2 Ensure `filterAssignments(assignments, filter)` is exported as a named pure function from `src/components/features/assignments/AssignmentsModule.tsx` (or a separate `src/lib/filterAssignments.ts` if preferred)
  - [ ] 15.3 Write Property 10 — Assignment filter subset and correctness: for any array of `AssignmentEntry` objects and any non-`"All"` filter value, every item in the filtered result is present in the original array (subset) and satisfies the filter predicate (correctness) (validates Requirements 10.1 and 10.4)
  - [ ] 15.4 Write Property 11 — Assignment filter idempotence: for any array of `AssignmentEntry` objects and any filter value, applying the same filter twice returns the same result as applying it once (validates Requirements 10.2)
  - [ ] 15.5 Write Property 12 — Assignment filter completeness for "All": for any array of `AssignmentEntry` objects, applying the `"All"` filter returns an array of the same length as the input (validates Requirements 10.3)
  - [ ] 15.6 Run `vitest run` on the filter test file and verify all 3 properties pass

- [ ] 16. Write property-based tests for gradebook aggregation
  - [ ] 16.1 Create `src/components/features/grades/gradebookAggregation.test.ts`
  - [ ] 16.2 Ensure the gradebook aggregation logic (combining homework + assignments + exams into a deduplicated `GradebookTask[]`) is exported as a named pure function from `GradebookModule.tsx` or a separate utility file
  - [ ] 16.3 Write Property 13 — Gradebook deduplication and completeness: for any combination of homework, assignments, and exams arrays where all IDs are unique across all three arrays, the combined `GradebookTask` list contains no two items with the same `id`, has length equal to the sum of the three input array lengths, and contains every item from every source array (validates Requirements 11.1, 11.2, and 11.3)
  - [ ] 16.4 Run `vitest run` on the gradebook test file and verify the property passes

- [ ] 17. Final verification and cleanup
  - [ ] 17.1 Run `next build` and verify it passes with zero TypeScript errors and zero module resolution failures
  - [ ] 17.2 Run `vitest run` and verify all property-based tests pass (Properties 1–13)
  - [ ] 17.3 Verify `src/App.tsx` is ≤ 150 lines
  - [ ] 17.4 Verify no source files remain directly under `src/` except `App.tsx` and `index.css` (which should now be at `src/styles/globals.css`); confirm `src/AttendanceView.tsx` and `src/AnalyticsModule.tsx` root-level files have been removed
  - [ ] 17.5 Verify all imports across the codebase use `@/`-prefixed paths (no cross-directory relative imports)
  - [ ] 17.6 Verify no component imports `CHILDREN` directly from `@/lib/mockData` or `@/lib/constants`; all child data access goes through `@/services/childService`
  - [ ] 17.7 Load the application in a browser and verify the initial UI renders correctly for Sara, Yonas, and Liya; verify homework confirmation persists across page reloads; verify the PDF download buttons work


## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3"] },
    { "wave": 4, "tasks": ["4"] },
    { "wave": 5, "tasks": ["5"] },
    { "wave": 6, "tasks": ["6"] },
    { "wave": 7, "tasks": ["7"] },
    { "wave": 8, "tasks": ["8"] },
    { "wave": 9, "tasks": ["9"] },
    { "wave": 10, "tasks": ["10"] },
    { "wave": 11, "tasks": ["11"] },
    { "wave": 12, "tasks": ["12", "13", "14", "15", "16"] },
    { "wave": 13, "tasks": ["17"] }
  ]
}
```

Tasks 12–16 can be executed in parallel once Task 11 is complete and their respective source modules exist.

## Notes

- Every task that modifies source files must be followed by `next build` passing before the next task begins (Requirement 13.2).
- Tasks 1–10 are pure structural refactoring — no Tailwind classes, animation parameters, or JSX structure may be changed (Requirement 14.1).
- The `src/lib/utils.ts` file currently contains all grade/subject utilities. Tasks 4.1–4.3 rename/split these into canonical files per the design spec. Backward-compatible re-exports in `utils.ts` can be used during the transition to avoid breaking existing consumers before they are updated.
- The `src/lib/constants.ts` file currently contains CHILDREN and PARENT_NAME. Task 5 migrates these to `mockData.ts` as the canonical location.
- Feature modules in `src/components/features/` are currently flat (not in domain subdirectories). Task 8 reorganizes them into the target `{domain}/` subdirectory structure.
- Property-based tests (Tasks 12–16) use fast-check with a minimum of 100 iterations per property, tagged with `// Feature: nextjs-codebase-refactor, Property N: <name>` comments.
- The `filterAssignments` function must be exported as a named pure function from `AssignmentsModule.tsx` (or a separate file) before Task 15 can be implemented.
- The gradebook aggregation logic must be exported as a named pure function from `GradebookModule.tsx` (or a separate file) before Task 16 can be implemented.
