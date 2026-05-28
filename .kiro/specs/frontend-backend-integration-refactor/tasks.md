# Implementation Plan: Frontend–Backend Integration Refactor

## Overview

Replace the hardcoded `mockData.ts` data flow with a production-ready integration stack: typed API contract → environment config → Axios HTTP client → typed services → TanStack Query hooks → MSW mock layer. All existing UI, UX, and component behavior is preserved exactly. The migration follows the discrete steps defined in the design document so the app remains functional at every stage.

## Tasks

- [x] 1. Install dependencies and verify build
  - Add `axios`, `@tanstack/react-query`, and `msw` as exact-version dependencies in `package.json`
  - Run `npm install` and confirm `npm run build` still passes with no new errors
  - _Requirements: 3.1, 6.1, 7.1_

- [x] 2. Create the types layer
  - [x] 2.1 Create `src/types/api.ts` with all API shapes
    - Define `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError` class, `API_ERROR_CODES`, `ApiErrorCode`, `LoginRequest`, `AuthResponse`, `RefreshRequest`, `LogAbsenceRequest`, `SendMessageRequest`, `AttendanceResponse`, `GradesResponse`
    - Ensure zero uses of `any` in this file
    - _Requirements: 4.1, 4.4, 4.5_

  - [x]* 2.2 Write property test for `ApiResponse` envelope (Property 1)
    - Create `src/types/__tests__/api.property.test.ts`
    - **Property 1: ApiResponse envelope preserves data**
    - **Validates: Requirements 1.2, 4.4**

  - [x]* 2.3 Write property test for `PaginatedResponse` (Property 2)
    - Add to `src/types/__tests__/api.property.test.ts`
    - **Property 2: PaginatedResponse preserves all items**
    - **Validates: Requirements 1.3, 4.4**

  - [x]* 2.4 Write property test for `ApiError` (Property 3)
    - Add to `src/types/__tests__/api.property.test.ts`
    - **Property 3: ApiError preserves errorCode, message, and status**
    - **Validates: Requirements 1.4, 5.4**

  - [x] 2.5 Create `src/types/ui.ts` with UI-only types
    - Define `ErrorMessageProps` and `ToastOptions`
    - _Requirements: 4.2_

  - [x] 2.6 Create placeholder `src/types/api.generated.ts`
    - Empty export file; documents the slot for future `openapi-typescript` output
    - _Requirements: 1.5, 4.6_

  - [x] 2.7 Update `src/types/index.ts` to re-export from `api.ts`, `ui.ts`, and `api.generated.ts`
    - Single import point for all types
    - _Requirements: 4.3_

- [x] 3. Create the config module and environment files
  - [x] 3.1 Create `src/lib/config.ts`
    - Implement `requireEnv` (throws with variable name when absent) and `optionalEnv` helpers
    - Export `config` object with `apiBaseUrl`, `apiTimeoutMs`, `enableMocks`
    - Export a `buildConfig` factory function for testability (used by property tests)
    - No component or service reads `process.env` directly
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

  - [x]* 3.2 Write property test for config env var reading (Property 4)
    - Create `src/lib/__tests__/config.property.test.ts`
    - **Property 4: Config module correctly reads and parses env vars**
    - **Validates: Requirements 2.1, 2.2**

  - [x]* 3.3 Write property test for config missing required var (Property 5)
    - Add to `src/lib/__tests__/config.property.test.ts`
    - **Property 5: Config module throws with variable name when required var is absent**
    - **Validates: Requirements 2.5**

  - [x] 3.4 Create environment files
    - Create `.env.development` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`, `NEXT_PUBLIC_API_TIMEOUT_MS=10000`, `NEXT_PUBLIC_ENABLE_MOCKS=true`
    - Create `.env.production` with `NEXT_PUBLIC_API_BASE_URL=https://api.kelem.school`, `NEXT_PUBLIC_API_TIMEOUT_MS=15000`, `NEXT_PUBLIC_ENABLE_MOCKS=false`
    - Update `.env.example` to document all three variables with descriptions
    - Ensure `.env.local` is listed in `.gitignore`
    - _Requirements: 2.4_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create the HTTP client
  - [x] 5.1 Create `src/lib/apiClient.ts`
    - Single Axios instance configured from `config.apiBaseUrl` and `config.apiTimeoutMs`
    - `withCredentials: true` for HttpOnly cookie support
    - Request interceptor: attach `Authorization: Bearer <token>` when token is present
    - Response interceptor: 401 → refresh+retry once → `onUnauthorized()` on second 401; 5xx → `onServerError()`; network error → `ApiError(NETWORK_ERROR)`; all other errors → normalized `ApiError`
    - Export `configureApiClient` for injecting `getAccessToken`, `onUnauthorized`, `onServerError`
    - This is the only file that creates an Axios instance
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x]* 5.2 Write property test for Bearer token attachment (Property 6)
    - Create `src/lib/__tests__/apiClient.property.test.ts`
    - **Property 6: HTTP client attaches Bearer token to every request**
    - **Validates: Requirements 3.2**

  - [x]* 5.3 Write property test for 5xx toast callback (Property 7)
    - Add to `src/lib/__tests__/apiClient.property.test.ts`
    - **Property 7: HTTP client triggers toast for all 5xx status codes**
    - **Validates: Requirements 3.4, 8.4**

  - [x]* 5.4 Write unit tests for HTTP client interceptor branches
    - Test 401 refresh flow (success path, retry-401 path, concurrent-requests path)
    - Test 403/404 do not redirect and normalize to `ApiError`
    - Test network error produces `ApiError` with `NETWORK_ERROR` code
    - _Requirements: 3.3, 3.5_

- [x] 6. Create the services layer
  - [x] 6.1 Update `src/services/childService.ts` to call `apiClient`
    - Replace `Promise.resolve(CHILDREN)` with `apiClient.get('/v1/children')` and unwrap envelope
    - Preserve the existing `getChildren(): Promise<Child[]>` signature exactly
    - Add `getChild(childId: string): Promise<Child>` for single-child fetch
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.2 Create `src/services/assignmentService.ts`
    - Implement `getAssignments(childId, params?)` and `getHomework(childId, params?)`
    - Unwrap `ApiResponse<PaginatedResponse<T>>` and return `.data.items`
    - No React imports; pure TypeScript
    - _Requirements: 5.1, 5.3, 5.5, 5.6_

  - [x] 6.3 Create `src/services/attendanceService.ts`
    - Implement `getAttendance(childId, params?)` returning `AttendanceResponse`
    - Implement `logAbsence(childId, body)` returning `AttendanceLogEntry`
    - _Requirements: 5.1, 5.3, 5.5, 5.6_

  - [x] 6.4 Create `src/services/gradeService.ts`
    - Implement `getGrades(childId)` returning `GradesResponse`
    - _Requirements: 5.1, 5.3, 5.5, 5.6_

  - [x] 6.5 Create `src/services/messageService.ts`
    - Implement `getMessages(params?)`, `getMessageThread(threadId)`, `sendMessage(threadId, body)`
    - _Requirements: 5.1, 5.3, 5.5, 5.6_

  - [x] 6.6 Create `src/services/notificationService.ts`
    - Implement `getNotifications(childId, params?)`
    - _Requirements: 5.1, 5.3, 5.5, 5.6_

  - [x] 6.7 Create `src/services/scheduleService.ts`
    - Implement `getSchedule(childId)`
    - _Requirements: 5.1, 5.3, 5.5, 5.6_

  - [x] 6.8 Create `src/services/authService.ts`
    - Implement `getAccessToken()`, `login(credentials)`, `logout(queryClient?)`, `refreshToken()`, `restoreSession()`
    - Store access token in module-level variable only (never `localStorage`)
    - _Requirements: 5.1, 9.1, 9.3, 9.4, 9.5_

  - [x]* 6.9 Write unit tests for services layer
    - Test each service function calls the correct API path with correct params
    - Test `authService.login` stores token; `authService.logout` clears token and calls `queryClient.clear()`
    - Test that failed calls propagate `ApiError` (not untyped errors)
    - _Requirements: 5.3, 5.4, 5.6_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create the MSW mock layer
  - [x] 8.1 Create MSW setup files
    - Create `src/mocks/browser.ts` with `setupWorker(...handlers)`
    - Create `src/mocks/server.ts` with `setupServer(...handlers)` for Vitest
    - Create `src/mocks/index.ts` with `initMocks()` conditional initializer (SSR guard included)
    - Run `npx msw init public/` to generate `public/mockServiceWorker.js`
    - _Requirements: 7.1, 7.3, 7.4_

  - [x] 8.2 Create MSW handlers for all resources
    - Create `src/mocks/handlers/children.ts` — `GET /v1/children`, `GET /v1/children/:childId`
    - Create `src/mocks/handlers/assignments.ts` — `GET /v1/children/:id/assignments`, `GET /v1/children/:id/homework`
    - Create `src/mocks/handlers/attendance.ts` — `GET /v1/children/:id/attendance`, `POST /v1/children/:id/attendance/absence`
    - Create `src/mocks/handlers/grades.ts` — `GET /v1/children/:id/grades`
    - Create `src/mocks/handlers/messages.ts` — `GET /v1/messages`, `GET /v1/messages/:threadId`, `POST /v1/messages/:threadId/reply`
    - Create `src/mocks/handlers/notifications.ts` — `GET /v1/children/:id/notifications`
    - Create `src/mocks/handlers/schedule.ts` — `GET /v1/children/:id/schedule`
    - Create `src/mocks/handlers/index.ts` aggregating all handler arrays
    - All handlers wrap fixture data from `src/lib/mockData.ts` in `ApiResponse<T>` envelope
    - _Requirements: 7.1, 7.2, 7.5, 7.6, 12.3_

  - [x]* 8.3 Write property test for mock handler response envelope (Property 8)
    - Create `src/mocks/__tests__/handlers.property.test.ts`
    - Use MSW Node server to call each handler and verify `ApiResponse` envelope shape
    - **Property 8: Mock handler responses conform to ApiResponse envelope**
    - **Validates: Requirements 7.2, 7.5**

  - [x]* 8.4 Write integration tests for mock layer
    - Start MSW server, call each service function, verify returned data matches fixture data
    - _Requirements: 7.2, 7.5, 7.7_

- [x] 9. Create the query keys module and TanStack Query providers
  - [x] 9.1 Create `src/lib/queryKeys.ts`
    - Define all query key factory functions: `children`, `child`, `assignments`, `homework`, `attendance`, `grades`, `messages`, `messageThread`, `notifications`, `schedule`
    - _Requirements: 6.1_

  - [x] 9.2 Create `src/app/providers.tsx`
    - Create `QueryClient` with `staleTime: 5 * 60 * 1000`, `retry: 2`, `refetchOnWindowFocus: false`, mutations `retry: 0`
    - Call `configureApiClient` with `getAccessToken`, `onUnauthorized` (clears token + redirects to `/login`), `onServerError` (dispatches `api:server-error` custom event)
    - Export `Providers` component wrapping children with `QueryClientProvider`
    - _Requirements: 6.1, 6.2, 3.3, 3.4_

  - [x] 9.3 Update `src/app/layout.tsx` to wrap children with `<Providers>` and initialize mocks
    - Import and render `<Providers>` around the existing children
    - Add conditional `initMocks()` call when `config.enableMocks` is true
    - _Requirements: 6.2, 7.3, 7.4_

- [x] 10. Create query hooks
  - [x] 10.1 Create `src/hooks/useChildren.ts`
    - `useQuery<Child[], ApiError>` with `queryKeys.children()` and `getChildren` as `queryFn`
    - _Requirements: 6.3, 6.4_

  - [x] 10.2 Create `src/hooks/useAssignments.ts`
    - `useQuery` with `queryKeys.assignments(childId)`, `enabled: Boolean(childId)`
    - _Requirements: 6.3, 6.4_

  - [x] 10.3 Create `src/hooks/useAttendance.ts`
    - `useQuery` with `queryKeys.attendance(childId)`, `enabled: Boolean(childId)`
    - _Requirements: 6.3, 6.4_

  - [x] 10.4 Create `src/hooks/useGrades.ts`
    - `useQuery` with `queryKeys.grades(childId)`, `enabled: Boolean(childId)`
    - _Requirements: 6.3, 6.4_

  - [x] 10.5 Create `src/hooks/useMessages.ts`
    - `useQuery` with `queryKeys.messages()` and `getMessages` as `queryFn`
    - _Requirements: 6.3, 6.4_

  - [x] 10.6 Create `src/hooks/useNotifications.ts`
    - `useQuery` with `queryKeys.notifications(childId)`, `enabled: Boolean(childId)`
    - _Requirements: 6.3, 6.4_

  - [x] 10.7 Create `src/hooks/useSchedule.ts`
    - `useQuery` with `queryKeys.schedule(childId)`, `enabled: Boolean(childId)`
    - _Requirements: 6.3, 6.4_

  - [x] 10.8 Create `src/hooks/useSendMessage.ts`
    - `useMutation` calling `sendMessage(threadId, body)`; on success invalidate `messageThread` and `messages` query keys
    - _Requirements: 6.6_

  - [x] 10.9 Create `src/hooks/useLogAbsence.ts`
    - `useMutation` calling `logAbsence(childId, body)`; on success invalidate `attendance` query key
    - _Requirements: 6.6_

  - [x] 10.10 Update `src/hooks/index.ts` to export all new hooks
    - _Requirements: 10.4_

- [x] 11. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Migrate `App.tsx` and wire mutation hooks into feature modules
  - [x] 12.1 Migrate `src/App.tsx` to use `useChildren()`
    - Replace `useEffect` + `useState<Child[]>` with `const { data: children = [], isLoading, isError, error } = useChildren()`
    - Render `<LoadingSpinner />` when `isLoading` is true
    - Render `<ErrorMessage error={error} />` when `isError` is true
    - The `child: Child` prop passed to all feature modules remains unchanged
    - Remove the direct `getChildren()` import from `App.tsx`
    - _Requirements: 6.5, 11.1, 11.2_

  - [x] 12.2 Wire `useSendMessage` into the messages feature
    - Update `src/hooks/useMessageThreads.ts` (or the relevant hook/component) to call `useSendMessage` for the `handleSend` function instead of any direct service call
    - _Requirements: 6.6, 11.1_

  - [x] 12.3 Wire `useLogAbsence` into the attendance feature
    - Update `src/components/features/attendance/LogAbsenceModal.tsx` (or its parent) to call `useLogAbsence` for the absence submission
    - _Requirements: 6.6, 11.1_

- [x] 13. Create error handling components
  - [x] 13.1 Create `src/components/ui/ErrorMessage.tsx`
    - Accept `error: ApiError` and optional `className`
    - Map known `errorCode` values to user-friendly strings; fall back to `error.message` for unknown codes
    - Render with `role="alert"` for accessibility
    - _Requirements: 8.1, 8.2, 10.2_

  - [x]* 13.2 Write property test for `ErrorMessage` component (Property 9)
    - Create `src/components/ui/__tests__/ErrorMessage.property.test.ts`
    - **Property 9: ErrorMessage renders non-empty text for any ApiError**
    - **Validates: Requirements 8.1**

  - [x]* 13.3 Write unit tests for `ErrorMessage`
    - Test renders correct message for each known `errorCode`
    - Test renders fallback for unknown `errorCode`
    - _Requirements: 8.1_

  - [x] 13.4 Create `src/components/ui/ErrorBoundary.tsx`
    - Class component implementing `getDerivedStateFromError`; wraps unknown errors in `ApiError(UNKNOWN_ERROR)`; renders `<ErrorMessage>` as fallback
    - _Requirements: 8.6_

  - [x]* 13.5 Write unit tests for `ErrorBoundary`
    - Test catches thrown errors and renders `ErrorMessage`
    - _Requirements: 8.6_

  - [x] 13.6 Wrap main content area in `App.tsx` with `<ErrorBoundary>`
    - _Requirements: 8.6_

- [x] 14. Create the API contract document
  - [x] 14.1 Create `API_CONTRACT.md` at the repository root
    - Document every endpoint (method, path, request params, request body, response shape)
    - Include standard response envelope format with success and error examples
    - Include pagination contract (`page`, `pageSize`, `total`, `items`)
    - Include error response format (`errorCode`, `message`, `details`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 12.1, 12.4, 12.5_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Run `npm test` and verify all existing tests (`filterAssignments.test.ts`, `gradebookAggregation.test.ts`, `useHomeworkConfirmation.test.ts`) pass without modification
  - Verify all new tests pass
  - Ensure `npm run build` succeeds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation — the app should remain functional after each numbered top-level task
- Property tests use `fast-check` (already installed) with a minimum of 100 iterations per property
- Unit tests complement property tests by covering specific examples and edge cases
- The `child: Child` prop shape passed to all feature modules is never changed — all feature components under `src/components/features/` are left untouched
- MSW handlers pull fixture data from the existing `src/lib/mockData.ts` — no fixture data is duplicated
- The `buildConfig` factory export from `src/lib/config.ts` is required for property tests to re-initialize config with different env vars per test run

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.5", "2.6"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.7", "3.1", "3.4"] },
    { "id": 3, "tasks": ["3.2", "3.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.4", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8"] },
    { "id": 5, "tasks": ["6.9", "8.1", "9.1"] },
    { "id": 6, "tasks": ["8.2", "9.2"] },
    { "id": 7, "tasks": ["8.3", "8.4", "9.3", "10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9"] },
    { "id": 8, "tasks": ["10.10", "13.1"] },
    { "id": 9, "tasks": ["12.1", "12.2", "12.3", "13.2", "13.3", "13.4"] },
    { "id": 10, "tasks": ["13.5", "13.6", "14.1"] },
    { "id": 11, "tasks": ["15"] }
  ]
}
```
