# Requirements Document

## Introduction

This feature refactors the Kelem Parent Portal (a Next.js + TypeScript application) to be cleanly integrable with an external backend API being built by a separate team. The goal is to establish a formal API contract, introduce a structured HTTP client, typed services layer, mock infrastructure, and data-fetching patterns so that when the real backend is ready, integration requires only swapping environment variables and generated types — not rewriting components or business logic. All existing UI, UX, and functionality must remain completely unchanged throughout the refactor.

The portal currently serves three children's academic data (grades, attendance, assignments, messages, notifications, schedule) through hardcoded mock data in `src/lib/mockData.ts`. The refactor will replace this with a production-ready integration layer while keeping the mock data available via MSW during development.

## Glossary

- **API_Client**: The single configured Axios instance at `src/lib/apiClient.ts` that all HTTP requests flow through.
- **API_Contract**: The formal, versioned document and TypeScript types describing every endpoint, request shape, and response shape the frontend consumes.
- **Auth_Service**: The service module at `src/services/authService.ts` responsible for login, logout, and token refresh operations.
- **Child_Service**: The service module at `src/services/childService.ts` responsible for fetching child and student data.
- **Config_Module**: The central configuration file at `src/lib/config.ts` that reads and exports all environment variables.
- **ErrorMessage_Component**: The reusable UI component at `src/components/ui/ErrorMessage.tsx` that displays API error states to the user.
- **Mock_Layer**: The MSW-based mock infrastructure in `src/mocks/` that intercepts HTTP requests and returns fixture data during development.
- **Providers_Component**: The React component at `src/app/providers.tsx` that wraps the application with `QueryClientProvider` and other global providers.
- **Query_Hook**: A custom React hook in `src/hooks/` that wraps a TanStack Query `useQuery` or `useMutation` call for a specific resource.
- **Service**: A TypeScript module in `src/services/` that is the sole caller of `API_Client` for a given backend resource, returning typed data and throwing typed errors.
- **TanStack_Query**: The `@tanstack/react-query` library used for all server-state management, caching, and background refetching.
- **ApiResponse**: The generic wrapper type `ApiResponse<T>` representing a standard backend response envelope.
- **PaginatedResponse**: The generic wrapper type `PaginatedResponse<T>` representing a paginated list response from the backend.
- **ApiError**: The typed error class representing a structured error returned by the backend.
- **MSW**: Mock Service Worker — the library used to intercept network requests in the browser during development.
- **OpenAPI**: The OpenAPI/Swagger specification format used to describe the backend API contract.

---

## Requirements

### Requirement 1: API Contract Definition

**User Story:** As a frontend developer, I want a documented and typed API contract for every endpoint the portal consumes, so that both frontend and backend teams share a single source of truth and integration is unambiguous.

#### Acceptance Criteria

1. THE API_Contract SHALL document every endpoint the frontend consumes, including HTTP method, path, request parameters, request body shape, and response body shape.
2. THE API_Contract SHALL define a standard response envelope used by all endpoints, including success and error cases.
3. THE API_Contract SHALL define a standard pagination contract for all list endpoints, including `page`, `pageSize`, `total`, and `items` fields.
4. THE API_Contract SHALL define a standard error response format including an `errorCode`, `message`, and optional `details` field.
5. WHEN an OpenAPI specification is provided by the backend team, THE Config_Module SHALL support running `openapi-typescript` to auto-generate `src/types/api.generated.ts` from that specification.
6. THE API_Contract SHALL be stored as a versioned document in the repository so that both teams can reference and update it.

---

### Requirement 2: Environment Configuration

**User Story:** As a developer, I want all environment-specific values controlled by environment variables, so that switching between development, staging, and production requires only changing `.env` files — not source code.

#### Acceptance Criteria

1. THE Config_Module SHALL read `NEXT_PUBLIC_API_BASE_URL` from the environment and export it as the base URL for all API requests.
2. THE Config_Module SHALL read `NEXT_PUBLIC_API_TIMEOUT_MS` from the environment and export it as the request timeout in milliseconds, defaulting to `10000` when the variable is absent.
3. THE Config_Module SHALL read `NEXT_PUBLIC_ENABLE_MOCKS` from the environment and export it as a boolean flag controlling whether the Mock_Layer is active.
4. THE System SHALL provide `.env.local`, `.env.development`, and `.env.production` template files documenting all required and optional environment variables with example values.
5. IF a required environment variable is absent at startup, THEN THE Config_Module SHALL throw a descriptive error identifying the missing variable by name.
6. THE Config_Module SHALL be the single import point for all environment values; no component or service SHALL read `process.env` directly.

---

### Requirement 3: HTTP Client

**User Story:** As a developer, I want a single, centrally configured HTTP client, so that all API calls share consistent base URL, timeout, authentication, and error-handling behavior without duplication.

#### Acceptance Criteria

1. THE API_Client SHALL be a single Axios instance configured with the base URL and timeout from the Config_Module.
2. THE API_Client SHALL attach a Bearer token from the current session to the `Authorization` header of every outgoing request via a request interceptor.
3. WHEN a response with HTTP status `401` is received, THE API_Client SHALL atomically clear the stored auth token and redirect the user to the login page; HTTP `403` and all other `4xx` status codes SHALL NOT be treated as authentication errors and SHALL NOT trigger token clearing or redirect.
4. WHEN a response with HTTP status `500` or higher is received, THE API_Client SHALL display a toast notification informing the user of a server error.
5. WHEN a network error occurs with no response, THE API_Client SHALL throw a typed `ApiError` with an `errorCode` of `NETWORK_ERROR`.
6. THE API_Client SHALL be the only module in the codebase that creates or configures an Axios instance; no component or service SHALL create its own Axios instance.

---

### Requirement 4: Types Layer

**User Story:** As a developer, I want a well-organized, strictly typed layer of API and UI types, so that data shapes are explicit, `any` is eliminated, and type errors surface at compile time rather than at runtime.

#### Acceptance Criteria

1. THE System SHALL provide `src/types/api.ts` containing hand-written types for all API request and response shapes not covered by auto-generation.
2. THE System SHALL provide `src/types/ui.ts` containing types used exclusively by UI components that do not map directly to API shapes.
3. THE System SHALL provide `src/types/index.ts` that re-exports all types from `api.ts`, `ui.ts`, and `api.generated.ts` as a single import point.
4. THE System SHALL define `ApiResponse<T>`, `PaginatedResponse<T>`, and `ApiError` as generic types in `src/types/api.ts`.
5. THE System SHALL contain zero uses of the TypeScript `any` type across all files in `src/types/`, `src/services/`, and `src/hooks/`.
6. WHEN the backend team updates the OpenAPI specification, THE System SHALL allow regenerating `src/types/api.generated.ts` without modifying any other type file.

---

### Requirement 5: Services Layer

**User Story:** As a developer, I want a dedicated services layer where all API calls are centralized, so that components and hooks never call the HTTP client directly and data-fetching logic is reusable and testable in isolation.

#### Acceptance Criteria

1. THE System SHALL provide one service file per backend resource in `src/services/` (e.g., `childService.ts`, `assignmentService.ts`, `attendanceService.ts`, `gradeService.ts`, `messageService.ts`, `notificationService.ts`, `scheduleService.ts`, `authService.ts`).
2. THE Child_Service SHALL be the only module that calls `API_Client` for child and student data endpoints.
3. WHEN a Service function is called, THE Service SHALL return data typed according to the API_Contract types.
4. WHEN an API call fails, THE Service SHALL throw a typed `ApiError` containing the `errorCode`, `message`, and HTTP status from the response; IF the Service cannot construct a specific `ApiError` from the response, THEN THE Service SHALL throw a generic `ApiError` with `errorCode` set to `UNKNOWN_ERROR` rather than throwing an untyped error or swallowing the exception.
5. THE Services layer SHALL contain no React imports, hooks, or JSX; it SHALL be framework-agnostic TypeScript.
6. THE Services layer SHALL export functions that are independently callable and testable without a React component tree.

---

### Requirement 6: Data Fetching with TanStack Query

**User Story:** As a developer, I want all server state managed through TanStack Query, so that caching, background refetching, loading states, and error states are handled consistently without manual `useEffect` + `useState` patterns.

#### Acceptance Criteria

1. THE System SHALL install `@tanstack/react-query` and configure a `QueryClient` with sensible defaults for `staleTime` and `retry`.
2. THE Providers_Component SHALL wrap the application with `QueryClientProvider` so that all Query_Hooks have access to the shared `QueryClient`.
3. THE System SHALL provide a Query_Hook for each Service function that fetches data (e.g., `useChildren`, `useAssignments`, `useAttendance`, `useGrades`, `useMessages`, `useNotifications`, `useSchedule`).
4. WHEN a Query_Hook is called, THE Query_Hook SHALL return `{ data, isLoading, isError, error }` typed according to the corresponding Service return type.
5. WHERE the Providers_Component (QueryClientProvider) is active in the component tree, THE System SHALL contain no raw `useEffect` + `useState` combinations used for data fetching from the API; all server state SHALL flow through TanStack Query.
6. WHEN a mutation is needed (e.g., sending a message, logging an absence), THE System SHALL provide a corresponding `useMutation` hook in `src/hooks/`.

---

### Requirement 7: Mock Layer with MSW

**User Story:** As a developer, I want a mock layer that intercepts HTTP requests and returns realistic fixture data, so that frontend development and testing can proceed independently of the real backend, and switching to the real API requires zero component changes.

#### Acceptance Criteria

1. THE System SHALL install `msw` and provide mock handlers in `src/mocks/handlers/` organized one file per resource (e.g., `children.ts`, `assignments.ts`, `attendance.ts`, `grades.ts`, `messages.ts`, `notifications.ts`, `schedule.ts`).
2. THE Mock_Layer SHALL intercept requests at the same URL paths defined in the API_Contract so that handlers mirror the real API exactly.
3. WHEN `NEXT_PUBLIC_ENABLE_MOCKS` is `true`, THE Mock_Layer SHALL be initialized before the application renders and SHALL intercept all matching requests.
4. WHEN `NEXT_PUBLIC_ENABLE_MOCKS` is `false`, THE Mock_Layer SHALL not be loaded or initialized, and all requests SHALL reach the real backend.
5. THE Mock_Layer handlers SHALL return data shaped identically to the API_Contract response types, including the standard response envelope and pagination contract.
6. THE Mock_Layer SHALL serve as executable documentation of the API contract, usable by the backend team as a reference implementation.
7. WHEN switching from mock to real backend, THE System SHALL require only an environment variable change; no component, hook, or service code SHALL need modification.

---

### Requirement 8: Error Handling

**User Story:** As a parent user, I want clear, consistent error messages when something goes wrong, so that I understand what happened and can take action without seeing raw technical errors.

#### Acceptance Criteria

1. THE System SHALL provide an `ErrorMessage_Component` in `src/components/ui/ErrorMessage.tsx` that accepts an `ApiError` and renders a user-friendly message.
2. WHEN a Query_Hook returns `isError: true`, THE component consuming that hook SHALL render the `ErrorMessage_Component` with the error.
3. WHEN a `401` response is received, THE API_Client SHALL handle it globally so that individual components do not need to handle authentication errors.
4. WHEN a `5xx` response is received, THE API_Client SHALL display a global toast notification so that individual components do not need to handle server errors; individual components SHALL NOT implement their own `5xx` error handling, and the global toast is the sole response to all `5xx` errors.
5. THE Services layer SHALL throw errors; THE Query_Hooks layer SHALL catch and expose errors; THE components layer SHALL display errors — each layer SHALL have a single, defined responsibility.
6. IF an unhandled error reaches a component boundary, THEN THE System SHALL render the `ErrorMessage_Component` as a fallback rather than a blank screen.

---

### Requirement 9: Authentication Pattern

**User Story:** As a parent user, I want my session to remain active across page refreshes and to be automatically renewed when my token expires, so that I am not unexpectedly logged out during normal use.

#### Acceptance Criteria

1. THE Auth_Service SHALL provide `login(credentials)`, `logout()`, and `refreshToken()` functions.
2. WHEN a `401` response is received and a refresh token is available, THE API_Client SHALL call `Auth_Service.refreshToken()` and retry the original request exactly once; IF the retry succeeds, THE API_Client SHALL return the successful response and SHALL NOT redirect the user; IF the retry also returns `401` or no refresh token is available, THEN THE API_Client SHALL clear the stored auth token and redirect the user to the login page.
3. WHEN `logout()` is called, THE Auth_Service SHALL clear all stored tokens and invalidate the TanStack Query cache.
4. THE Auth_Service SHALL store tokens in a secure, HttpOnly-compatible mechanism; tokens SHALL NOT be stored in `localStorage` in production.
5. WHEN the application initializes, THE Auth_Service SHALL check for an existing valid session and restore it without requiring the user to log in again.

---

### Requirement 10: Folder Structure and Code Organization

**User Story:** As a developer, I want a predictable, well-organized folder structure, so that any team member can locate any file by its type and responsibility without searching.

#### Acceptance Criteria

1. THE System SHALL organize source code under `src/` with the following top-level directories: `app/`, `components/ui/`, `components/features/`, `hooks/`, `lib/`, `mocks/`, `services/`, `types/`, `styles/`.
2. THE `src/components/ui/` directory SHALL contain only generic, reusable UI primitives with no business logic, data formatting, input validation, or direct API calls; data formatting and input validation SHALL be implemented in hooks or services, not in `src/components/ui/` components.
3. THE `src/components/features/` directory SHALL contain feature-specific components that consume Query_Hooks and render data; they SHALL NOT call services or API_Client directly.
4. THE `src/hooks/` directory SHALL contain only custom React hooks; no business logic or API calls SHALL exist outside of hooks and services.
5. THE `src/services/` directory SHALL contain only Service modules; no React code SHALL exist in this directory.
6. THE `src/mocks/` directory SHALL contain MSW handlers, browser/server setup files, and fixture data.

---

### Requirement 11: Zero UI/UX Regression

**User Story:** As a product owner, I want the refactor to produce no visible changes to the user interface or user experience, so that parents using the portal notice no difference before and after the integration work.

#### Acceptance Criteria

1. THE System SHALL preserve all existing visual layouts, component hierarchies, navigation flows, and interactive behaviors after the refactor is complete.
2. WHEN the Mock_Layer is active, THE System SHALL render identical UI output to the current hardcoded mock data implementation.
3. THE System SHALL not remove, rename, or restructure any existing component in `src/components/features/` or `src/components/ui/` as part of this refactor.
4. THE System SHALL not change any CSS class names, Tailwind utility classes, or animation definitions used by existing components.
5. WHEN the refactor is complete, THE System SHALL pass all existing tests without modification to test assertions.

---

### Requirement 12: Backend Team Handoff

**User Story:** As a backend developer, I want clear, executable documentation of what the frontend expects from the API, so that I can build endpoints that integrate without back-and-forth clarification.

#### Acceptance Criteria

1. THE System SHALL provide an `API_CONTRACT.md` document at the repository root describing every endpoint, request/response shape, error format, and pagination contract.
2. THE `src/types/api.ts` file SHALL be shareable with the backend team as the authoritative TypeScript definition of all data shapes.
3. THE Mock_Layer handlers SHALL serve as executable documentation that the backend team can run locally to observe expected request/response behavior.
4. THE API_CONTRACT.md SHALL specify the agreed error response format including `errorCode`, `message`, and `details` fields.
5. THE API_CONTRACT.md SHALL specify the agreed pagination response format including `page`, `pageSize`, `total`, and `items` fields.
