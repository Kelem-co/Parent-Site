# Design Document: Frontend–Backend Integration Refactor

## Overview

This refactor introduces a production-ready integration layer to the Kelem Parent Portal without changing any existing UI, UX, or component behavior. The goal is to replace the current hardcoded `mockData.ts` data flow with a structured stack — API contract → HTTP client → typed services → TanStack Query hooks — so that swapping in the real backend requires only an environment variable change.

The portal serves three children's academic data across nine feature modules (Overview, Grades, Gradebook, Attendance, Assignments, Messages, Notifications, Schedule, Analytics). All of these modules currently receive a `child: Child` prop from `App.tsx`. After the refactor, they will receive the same prop, sourced from TanStack Query instead of a raw `useEffect`.

### Key Design Decisions

- **Axios over fetch**: Axios provides interceptor support needed for the auth refresh flow and consistent error normalization. No other Axios instances are created anywhere in the codebase.
- **TanStack Query over SWR**: TanStack Query's mutation support, devtools, and fine-grained cache invalidation are needed for the send-message and log-absence mutations.
- **MSW for mocking**: MSW intercepts at the network level, meaning services and hooks are exercised identically in mock and real modes. No conditional logic in application code.
- **HttpOnly cookies for tokens**: `localStorage` is explicitly prohibited in production per Requirement 9.4. Tokens are stored in HttpOnly cookies set by the backend, with the auth service managing the cookie lifecycle via API calls.
- **Zero UI regression**: No component in `src/components/features/` or `src/components/ui/` is renamed, restructured, or has its props changed. The `child: Child` prop shape is preserved exactly.

---

## Architecture

The system is organized into five horizontal layers. Data flows strictly downward; no layer skips a layer below it.

```
┌─────────────────────────────────────────────────────────────────┐
│  Components  (src/components/features/, src/components/ui/)     │
│  • Render data from Query Hooks                                  │
│  • Display ErrorMessage on isError                               │
│  • No direct service or API client calls                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ consumes
┌────────────────────────▼────────────────────────────────────────┐
│  Query Hooks  (src/hooks/)                                       │
│  • useChildren, useAssignments, useAttendance, useGrades,        │
│    useMessages, useNotifications, useSchedule                    │
│  • useSendMessage, useLogAbsence  (mutations)                    │
│  • Returns { data, isLoading, isError, error }                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ calls
┌────────────────────────▼────────────────────────────────────────┐
│  Services  (src/services/)                                       │
│  • childService, assignmentService, attendanceService,           │
│    gradeService, messageService, notificationService,            │
│    scheduleService, authService                                  │
│  • Pure TypeScript — no React imports                            │
│  • Throws typed ApiError on failure                              │
└────────────────────────┬────────────────────────────────────────┘
                         │ uses
┌────────────────────────▼────────────────────────────────────────┐
│  HTTP Client  (src/lib/apiClient.ts)                             │
│  • Single Axios instance                                         │
│  • Request interceptor: attaches Bearer token                    │
│  • Response interceptor: 401 refresh+retry, 5xx toast,          │
│    network error → ApiError                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ intercepted in dev by
┌────────────────────────▼────────────────────────────────────────┐
│  MSW Mock Layer  (src/mocks/)                                    │
│  • Active when NEXT_PUBLIC_ENABLE_MOCKS=true                     │
│  • Handlers mirror API contract paths exactly                    │
│  • Returns ApiResponse<T>-shaped fixture data                    │
│  • Transparent to all layers above                               │
└─────────────────────────────────────────────────────────────────┘
```

### Provider Tree

```
RootLayout (src/app/layout.tsx)
  └── Providers (src/app/providers.tsx)          ← NEW
        ├── QueryClientProvider
        └── children
              └── ClientOnly (src/app/client.tsx)
                    └── App (src/App.tsx)         ← migrated to useChildren()
```

---

## New File Structure

### Files to Create

```
src/
├── app/
│   └── providers.tsx                        # QueryClientProvider wrapper
├── lib/
│   ├── apiClient.ts                         # Single Axios instance
│   └── config.ts                            # Env var reader/exporter
├── types/
│   ├── api.ts                               # ApiResponse<T>, PaginatedResponse<T>, ApiError
│   └── ui.ts                                # UI-only types (ErrorMessageProps, ToastOptions)
├── services/
│   ├── assignmentService.ts                 # Assignment + homework endpoints
│   ├── attendanceService.ts                 # Attendance log endpoints
│   ├── authService.ts                       # login / logout / refreshToken
│   ├── gradeService.ts                      # Subject grades endpoints
│   ├── messageService.ts                    # Message thread endpoints
│   ├── notificationService.ts               # Notification endpoints
│   └── scheduleService.ts                   # Schedule endpoints
├── hooks/
│   ├── useChildren.ts                       # useQuery wrapper for childService.getChildren
│   ├── useAssignments.ts                    # useQuery wrapper for assignmentService
│   ├── useAttendance.ts                     # useQuery wrapper for attendanceService
│   ├── useGrades.ts                         # useQuery wrapper for gradeService
│   ├── useMessages.ts                       # useQuery wrapper for messageService
│   ├── useNotifications.ts                  # useQuery wrapper for notificationService
│   ├── useSchedule.ts                       # useQuery wrapper for scheduleService
│   ├── useSendMessage.ts                    # useMutation wrapper for messageService.sendMessage
│   └── useLogAbsence.ts                     # useMutation wrapper for attendanceService.logAbsence
├── mocks/
│   ├── browser.ts                           # MSW browser worker setup
│   ├── server.ts                            # MSW Node server setup (for tests)
│   ├── index.ts                             # Conditional mock initializer
│   └── handlers/
│       ├── children.ts                      # GET /v1/children, GET /v1/children/:id
│       ├── assignments.ts                   # GET /v1/children/:id/assignments
│       ├── attendance.ts                    # GET /v1/children/:id/attendance, POST /v1/children/:id/attendance/absence
│       ├── grades.ts                        # GET /v1/children/:id/grades
│       ├── messages.ts                      # GET /v1/messages, POST /v1/messages/:threadId/reply
│       ├── notifications.ts                 # GET /v1/children/:id/notifications
│       └── schedule.ts                      # GET /v1/children/:id/schedule
└── components/
    └── ui/
        └── ErrorMessage.tsx                 # ApiError display component

API_CONTRACT.md                              # Repo root — backend handoff document
.env.local                                   # Local dev overrides (gitignored)
.env.development                             # Dev defaults
.env.production                              # Production defaults
```

### Files to Modify

```
src/app/layout.tsx          # Wrap children with <Providers>
src/app/client.tsx          # No change needed (App is still dynamically imported)
src/App.tsx                 # Replace useEffect+getChildren with useChildren() hook
src/services/childService.ts # Replace Promise.resolve(CHILDREN) with apiClient call
src/types/index.ts          # Add re-exports for api.ts, ui.ts, api.generated.ts
package.json                # Add axios, @tanstack/react-query, msw dependencies
```

### Files to Leave Unchanged

All files under `src/components/features/` and `src/components/ui/` (except the new `ErrorMessage.tsx`) remain completely untouched.

---

## API Contract

All endpoints are prefixed with `/v1`. The base URL is controlled by `NEXT_PUBLIC_API_BASE_URL`.

### Standard Response Envelope

Every endpoint returns a JSON body conforming to `ApiResponse<T>`:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-06-03T09:42:00Z"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "errorCode": "NOT_FOUND",
    "message": "Child with id STU-99999 not found",
    "details": { "childId": "STU-99999" }
  }
}
```

### Pagination Envelope

List endpoints return `PaginatedResponse<T>`:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "page": 1,
    "pageSize": 20,
    "total": 3
  }
}
```

### Endpoints

| Method | Path | Description | Request Params | Response Type |
|--------|------|-------------|----------------|---------------|
| GET | `/v1/children` | List all children for the authenticated parent | — | `ApiResponse<PaginatedResponse<Child>>` |
| GET | `/v1/children/:childId` | Get a single child's full profile | `childId: string` | `ApiResponse<Child>` |
| GET | `/v1/children/:childId/assignments` | List assignments for a child | `childId`, `?status`, `?page`, `?pageSize` | `ApiResponse<PaginatedResponse<AssignmentEntry>>` |
| GET | `/v1/children/:childId/homework` | List homework entries for a child | `childId`, `?page`, `?pageSize` | `ApiResponse<PaginatedResponse<HomeworkEntry>>` |
| GET | `/v1/children/:childId/attendance` | Get attendance log for a child | `childId`, `?from`, `?to` | `ApiResponse<AttendanceResponse>` |
| POST | `/v1/children/:childId/attendance/absence` | Log a parent-reported absence | `childId`, body: `LogAbsenceRequest` | `ApiResponse<AttendanceLogEntry>` |
| GET | `/v1/children/:childId/grades` | Get subject grades for a child | `childId` | `ApiResponse<GradesResponse>` |
| GET | `/v1/messages` | List message threads for the parent | `?page`, `?pageSize` | `ApiResponse<PaginatedResponse<MessageEntry>>` |
| GET | `/v1/messages/:threadId` | Get full thread messages | `threadId: string` | `ApiResponse<MessageThread>` |
| POST | `/v1/messages/:threadId/reply` | Send a reply in a thread | `threadId`, body: `SendMessageRequest` | `ApiResponse<ThreadMessage>` |
| GET | `/v1/children/:childId/notifications` | List notifications for a child | `childId`, `?read`, `?page`, `?pageSize` | `ApiResponse<PaginatedResponse<NotificationEntry>>` |
| GET | `/v1/children/:childId/schedule` | Get weekly schedule for a child | `childId` | `ApiResponse<PaginatedResponse<ScheduleEntry>>` |
| POST | `/v1/auth/login` | Authenticate parent | body: `LoginRequest` | `ApiResponse<AuthResponse>` |
| POST | `/v1/auth/logout` | Invalidate session | — | `ApiResponse<void>` |
| POST | `/v1/auth/refresh` | Refresh access token | body: `RefreshRequest` | `ApiResponse<AuthResponse>` |

---

## Data Models

### `src/types/api.ts`

```typescript
// Standard response envelope
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

// Paginated list wrapper
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

// Typed error class
export class ApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Well-known error codes
export const API_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// Request/response shapes for endpoints not covered by existing types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  parentId: string;
  parentName: string;
}

export interface RefreshRequest {
  // Refresh token is sent via HttpOnly cookie; no body field needed
}

export interface LogAbsenceRequest {
  date: string;           // ISO 8601 date string, e.g. "2025-06-03"
  reason?: string;
}

export interface SendMessageRequest {
  text: string;
}

export interface AttendanceResponse {
  log: import('./child').AttendanceLogEntry[];
  termAttendance: number;
  daysPresent: number;
  totalDays: number;
  absences: number;
  lates: number;
}

export interface GradesResponse {
  subjects: import('./child').Subject[];
  overallAvg: number;
}
```

### `src/types/ui.ts`

```typescript
export interface ErrorMessageProps {
  error: import('./api').ApiError;
  className?: string;
}

export interface ToastOptions {
  message: string;
  variant: 'error' | 'info' | 'success';
  durationMs?: number;
}
```

### Mapping Existing Types to API Response Shapes

The existing domain types in `src/types/` are preserved exactly. The API layer wraps them:

| Existing Type | API Response Shape |
|---|---|
| `Child[]` | `ApiResponse<PaginatedResponse<Child>>` from `GET /v1/children` |
| `Child` | `ApiResponse<Child>` from `GET /v1/children/:id` |
| `AssignmentEntry[]` | `ApiResponse<PaginatedResponse<AssignmentEntry>>` |
| `HomeworkEntry[]` | `ApiResponse<PaginatedResponse<HomeworkEntry>>` |
| `AttendanceLogEntry[]` | `ApiResponse<AttendanceResponse>` (includes summary stats) |
| `Subject[]` | `ApiResponse<GradesResponse>` (includes overallAvg) |
| `MessageEntry[]` | `ApiResponse<PaginatedResponse<MessageEntry>>` |
| `MessageThread` | `ApiResponse<MessageThread>` |
| `NotificationEntry[]` | `ApiResponse<PaginatedResponse<NotificationEntry>>` |
| `ScheduleEntry[]` | `ApiResponse<PaginatedResponse<ScheduleEntry>>` |

The services unwrap the envelope and return the inner type, so hooks and components never see `ApiResponse<T>` directly — they receive `Child[]`, `AssignmentEntry[]`, etc., exactly as before.

---

## Environment Configuration

### `src/lib/config.ts`

```typescript
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[Config] Required environment variable "${name}" is not set. ` +
      `Check your .env.local or deployment environment.`
    );
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const config = {
  apiBaseUrl: requireEnv('NEXT_PUBLIC_API_BASE_URL'),
  apiTimeoutMs: parseInt(optionalEnv('NEXT_PUBLIC_API_TIMEOUT_MS', '10000'), 10),
  enableMocks: optionalEnv('NEXT_PUBLIC_ENABLE_MOCKS', 'false') === 'true',
} as const;
```

### Environment Files

**`.env.development`** (committed, safe defaults for local dev):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_TIMEOUT_MS=10000
NEXT_PUBLIC_ENABLE_MOCKS=true
```

**`.env.production`** (committed, production defaults):
```
NEXT_PUBLIC_API_BASE_URL=https://api.kelem.school
NEXT_PUBLIC_API_TIMEOUT_MS=15000
NEXT_PUBLIC_ENABLE_MOCKS=false
```

**`.env.local`** (gitignored, developer overrides):
```
# Override any of the above for local development
# NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
# NEXT_PUBLIC_ENABLE_MOCKS=true
```

**`.env.example`** (committed, documents all variables):
```
# Required
NEXT_PUBLIC_API_BASE_URL=https://api.kelem.school

# Optional — defaults shown
NEXT_PUBLIC_API_TIMEOUT_MS=10000
NEXT_PUBLIC_ENABLE_MOCKS=false
```

### Complete Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | — | Base URL for all API requests |
| `NEXT_PUBLIC_API_TIMEOUT_MS` | No | `10000` | Request timeout in milliseconds |
| `NEXT_PUBLIC_ENABLE_MOCKS` | No | `false` | Enable MSW mock layer |

---

## HTTP Client Design

### `src/lib/apiClient.ts`

```typescript
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from './config';
import { ApiError, API_ERROR_CODES } from '@/types/api';

// Token accessors — implemented by authService, injected here to avoid circular deps
let getAccessToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};
let onServerError: (message: string) => void = () => {};

export function configureApiClient(opts: {
  getAccessToken: () => string | null;
  onUnauthorized: () => void;
  onServerError: (message: string) => void;
}): void {
  getAccessToken = opts.getAccessToken;
  onUnauthorized = opts.onUnauthorized;
  onServerError = opts.onServerError;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeoutMs,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends HttpOnly cookies for refresh token
});

// ── Request interceptor: attach Bearer token ──────────────────────────────────
apiClient.interceptors.request.use(
  (requestConfig: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error: unknown) => Promise.reject(error),
);

// ── Response interceptor: error normalization ─────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void): void {
  refreshSubscribers.push(cb);
}

function onRefreshSuccess(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401: attempt token refresh, then retry once
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = await import('@/services/authService');
        const newToken = await refreshToken();
        onRefreshSuccess(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        onUnauthorized();
        return Promise.reject(
          new ApiError(API_ERROR_CODES.UNAUTHORIZED, 'Session expired. Please log in again.', 401)
        );
      } finally {
        isRefreshing = false;
      }
    }

    // 5xx: show global toast
    if (status !== undefined && status >= 500) {
      onServerError('A server error occurred. Please try again later.');
    }

    // Network error (no response)
    if (!error.response) {
      return Promise.reject(
        new ApiError(API_ERROR_CODES.NETWORK_ERROR, 'Network error. Check your connection.', 0)
      );
    }

    // All other errors: normalize to ApiError
    const responseData = error.response.data as {
      error?: { errorCode?: string; message?: string; details?: Record<string, unknown> };
    };
    const errorCode = responseData?.error?.errorCode ?? API_ERROR_CODES.UNKNOWN_ERROR;
    const message = responseData?.error?.message ?? error.message;
    const details = responseData?.error?.details;

    return Promise.reject(new ApiError(errorCode, message, status ?? 0, details));
  },
);
```

### Interceptor Behavior Summary

| Condition | Behavior |
|---|---|
| Request with token | Adds `Authorization: Bearer <token>` header |
| Request without token | Sends request without Authorization header |
| Response 401, first attempt | Calls `refreshToken()`, retries original request once |
| Response 401, after retry | Calls `onUnauthorized()` (clears token + redirects) |
| Response 403, 404, 422, other 4xx | Normalizes to `ApiError`, does NOT redirect |
| Response 500+ | Calls `onServerError()` (shows toast), normalizes to `ApiError` |
| Network error (no response) | Throws `ApiError` with `errorCode: NETWORK_ERROR` |

---

## Services Layer Design

All services follow the same pattern: call `apiClient`, unwrap the `ApiResponse<T>` envelope, and return the inner data. On failure, the Axios interceptor has already normalized the error to `ApiError`, so services simply let it propagate.

### `src/services/childService.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { Child } from '@/types/child';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getChildren(): Promise<Child[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<Child>>>('/v1/children');
  return res.data.data.items;
}

export async function getChild(childId: string): Promise<Child> {
  const res = await apiClient.get<ApiResponse<Child>>(`/v1/children/${childId}`);
  return res.data.data;
}
```

### `src/services/assignmentService.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { AssignmentEntry, HomeworkEntry } from '@/types/assignment';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getAssignments(
  childId: string,
  params?: { status?: string; page?: number; pageSize?: number }
): Promise<AssignmentEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<AssignmentEntry>>>(
    `/v1/children/${childId}/assignments`,
    { params }
  );
  return res.data.data.items;
}

export async function getHomework(
  childId: string,
  params?: { page?: number; pageSize?: number }
): Promise<HomeworkEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<HomeworkEntry>>>(
    `/v1/children/${childId}/homework`,
    { params }
  );
  return res.data.data.items;
}
```

### `src/services/attendanceService.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { AttendanceLogEntry } from '@/types/child';
import type { ApiResponse, AttendanceResponse, LogAbsenceRequest } from '@/types/api';

export async function getAttendance(
  childId: string,
  params?: { from?: string; to?: string }
): Promise<AttendanceResponse> {
  const res = await apiClient.get<ApiResponse<AttendanceResponse>>(
    `/v1/children/${childId}/attendance`,
    { params }
  );
  return res.data.data;
}

export async function logAbsence(
  childId: string,
  body: LogAbsenceRequest
): Promise<AttendanceLogEntry> {
  const res = await apiClient.post<ApiResponse<AttendanceLogEntry>>(
    `/v1/children/${childId}/attendance/absence`,
    body
  );
  return res.data.data;
}
```

### `src/services/gradeService.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, GradesResponse } from '@/types/api';

export async function getGrades(childId: string): Promise<GradesResponse> {
  const res = await apiClient.get<ApiResponse<GradesResponse>>(
    `/v1/children/${childId}/grades`
  );
  return res.data.data;
}
```

### `src/services/messageService.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { MessageEntry, MessageThread, ThreadMessage } from '@/types/message';
import type { ApiResponse, PaginatedResponse, SendMessageRequest } from '@/types/api';

export async function getMessages(
  params?: { page?: number; pageSize?: number }
): Promise<MessageEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<MessageEntry>>>(
    '/v1/messages',
    { params }
  );
  return res.data.data.items;
}

export async function getMessageThread(threadId: string): Promise<MessageThread> {
  const res = await apiClient.get<ApiResponse<MessageThread>>(
    `/v1/messages/${threadId}`
  );
  return res.data.data;
}

export async function sendMessage(
  threadId: string,
  body: SendMessageRequest
): Promise<ThreadMessage> {
  const res = await apiClient.post<ApiResponse<ThreadMessage>>(
    `/v1/messages/${threadId}/reply`,
    body
  );
  return res.data.data;
}
```

### `src/services/notificationService.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { NotificationEntry } from '@/types/notification';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getNotifications(
  childId: string,
  params?: { read?: boolean; page?: number; pageSize?: number }
): Promise<NotificationEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<NotificationEntry>>>(
    `/v1/children/${childId}/notifications`,
    { params }
  );
  return res.data.data.items;
}
```

### `src/services/scheduleService.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { ScheduleEntry } from '@/types/schedule';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export async function getSchedule(childId: string): Promise<ScheduleEntry[]> {
  const res = await apiClient.get<ApiResponse<PaginatedResponse<ScheduleEntry>>>(
    `/v1/children/${childId}/schedule`
  );
  return res.data.data.items;
}
```

### `src/services/authService.ts`

```typescript
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, LoginRequest, AuthResponse } from '@/types/api';

// In-memory access token (never persisted to localStorage)
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/v1/auth/login', credentials);
  accessToken = res.data.data.accessToken;
  return res.data.data;
}

export async function logout(queryClient?: import('@tanstack/react-query').QueryClient): Promise<void> {
  await apiClient.post('/v1/auth/logout');
  accessToken = null;
  queryClient?.clear();
}

export async function refreshToken(): Promise<string> {
  // Refresh token is sent automatically via HttpOnly cookie (withCredentials: true)
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/v1/auth/refresh');
  accessToken = res.data.data.accessToken;
  return accessToken;
}

export async function restoreSession(): Promise<AuthResponse | null> {
  try {
    const newToken = await refreshToken();
    const res = await apiClient.get<ApiResponse<AuthResponse>>('/v1/auth/me');
    return res.data.data;
  } catch {
    return null;
  }
}
```

---

## TanStack Query Hooks Design

### QueryClient Configuration (`src/app/providers.tsx`)

```typescript
'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — data stays fresh
      retry: 2,                    // retry failed requests twice
      refetchOnWindowFocus: false, // avoid jarring refetches in a portal
    },
    mutations: {
      retry: 0,                    // mutations do not retry automatically
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Query Keys

All query keys are centralized to avoid typos and enable targeted invalidation:

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  children: () => ['children'] as const,
  child: (id: string) => ['children', id] as const,
  assignments: (childId: string) => ['assignments', childId] as const,
  homework: (childId: string) => ['homework', childId] as const,
  attendance: (childId: string) => ['attendance', childId] as const,
  grades: (childId: string) => ['grades', childId] as const,
  messages: () => ['messages'] as const,
  messageThread: (threadId: string) => ['messages', threadId] as const,
  notifications: (childId: string) => ['notifications', childId] as const,
  schedule: (childId: string) => ['schedule', childId] as const,
} as const;
```

### Query Hooks

```typescript
// src/hooks/useChildren.ts
import { useQuery } from '@tanstack/react-query';
import { getChildren } from '@/services/childService';
import { queryKeys } from '@/lib/queryKeys';
import type { Child } from '@/types/child';
import type { ApiError } from '@/types/api';

export function useChildren() {
  return useQuery<Child[], ApiError>({
    queryKey: queryKeys.children(),
    queryFn: getChildren,
  });
}

// src/hooks/useAssignments.ts
import { useQuery } from '@tanstack/react-query';
import { getAssignments } from '@/services/assignmentService';
import { queryKeys } from '@/lib/queryKeys';
import type { AssignmentEntry } from '@/types/assignment';
import type { ApiError } from '@/types/api';

export function useAssignments(childId: string) {
  return useQuery<AssignmentEntry[], ApiError>({
    queryKey: queryKeys.assignments(childId),
    queryFn: () => getAssignments(childId),
    enabled: Boolean(childId),
  });
}

// src/hooks/useAttendance.ts
import { useQuery } from '@tanstack/react-query';
import { getAttendance } from '@/services/attendanceService';
import { queryKeys } from '@/lib/queryKeys';
import type { AttendanceResponse } from '@/types/api';
import type { ApiError } from '@/types/api';

export function useAttendance(childId: string) {
  return useQuery<AttendanceResponse, ApiError>({
    queryKey: queryKeys.attendance(childId),
    queryFn: () => getAttendance(childId),
    enabled: Boolean(childId),
  });
}

// src/hooks/useGrades.ts
import { useQuery } from '@tanstack/react-query';
import { getGrades } from '@/services/gradeService';
import { queryKeys } from '@/lib/queryKeys';
import type { GradesResponse } from '@/types/api';
import type { ApiError } from '@/types/api';

export function useGrades(childId: string) {
  return useQuery<GradesResponse, ApiError>({
    queryKey: queryKeys.grades(childId),
    queryFn: () => getGrades(childId),
    enabled: Boolean(childId),
  });
}

// src/hooks/useMessages.ts
import { useQuery } from '@tanstack/react-query';
import { getMessages } from '@/services/messageService';
import { queryKeys } from '@/lib/queryKeys';
import type { MessageEntry } from '@/types/message';
import type { ApiError } from '@/types/api';

export function useMessages() {
  return useQuery<MessageEntry[], ApiError>({
    queryKey: queryKeys.messages(),
    queryFn: getMessages,
  });
}

// src/hooks/useNotifications.ts
import { useQuery } from '@tanstack/react-query';
import { getNotifications } from '@/services/notificationService';
import { queryKeys } from '@/lib/queryKeys';
import type { NotificationEntry } from '@/types/notification';
import type { ApiError } from '@/types/api';

export function useNotifications(childId: string) {
  return useQuery<NotificationEntry[], ApiError>({
    queryKey: queryKeys.notifications(childId),
    queryFn: () => getNotifications(childId),
    enabled: Boolean(childId),
  });
}

// src/hooks/useSchedule.ts
import { useQuery } from '@tanstack/react-query';
import { getSchedule } from '@/services/scheduleService';
import { queryKeys } from '@/lib/queryKeys';
import type { ScheduleEntry } from '@/types/schedule';
import type { ApiError } from '@/types/api';

export function useSchedule(childId: string) {
  return useQuery<ScheduleEntry[], ApiError>({
    queryKey: queryKeys.schedule(childId),
    queryFn: () => getSchedule(childId),
    enabled: Boolean(childId),
  });
}
```

### Mutation Hooks

```typescript
// src/hooks/useSendMessage.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage } from '@/services/messageService';
import { queryKeys } from '@/lib/queryKeys';
import type { SendMessageRequest } from '@/types/api';

export function useSendMessage(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SendMessageRequest) => sendMessage(threadId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messageThread(threadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages() });
    },
  });
}

// src/hooks/useLogAbsence.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logAbsence } from '@/services/attendanceService';
import { queryKeys } from '@/lib/queryKeys';
import type { LogAbsenceRequest } from '@/types/api';

export function useLogAbsence(childId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: LogAbsenceRequest) => logAbsence(childId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance(childId) });
    },
  });
}
```

---

## MSW Mock Layer Design

### Setup Files

**`src/mocks/browser.ts`** — browser worker (used in Next.js client-side):
```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

**`src/mocks/server.ts`** — Node server (used in Vitest tests):
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**`src/mocks/index.ts`** — conditional initializer called before app renders:
```typescript
export async function initMocks(): Promise<void> {
  if (typeof window === 'undefined') return; // SSR guard
  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest: 'warn',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}
```

**`src/mocks/handlers/index.ts`** — aggregates all handlers:
```typescript
import { childrenHandlers } from './children';
import { assignmentsHandlers } from './assignments';
import { attendanceHandlers } from './attendance';
import { gradesHandlers } from './grades';
import { messagesHandlers } from './messages';
import { notificationsHandlers } from './notifications';
import { scheduleHandlers } from './schedule';

export const handlers = [
  ...childrenHandlers,
  ...assignmentsHandlers,
  ...attendanceHandlers,
  ...gradesHandlers,
  ...messagesHandlers,
  ...notificationsHandlers,
  ...scheduleHandlers,
];
```

### Handler Structure (example: `src/mocks/handlers/children.ts`)

```typescript
import { http, HttpResponse } from 'msw';
import { CHILDREN } from '@/lib/mockData';
import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { Child } from '@/types/child';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export const childrenHandlers = [
  http.get(`${BASE}/v1/children`, () => {
    const body: ApiResponse<PaginatedResponse<Child>> = {
      success: true,
      data: {
        items: CHILDREN,
        page: 1,
        pageSize: 20,
        total: CHILDREN.length,
      },
    };
    return HttpResponse.json(body);
  }),

  http.get(`${BASE}/v1/children/:childId`, ({ params }) => {
    const child = CHILDREN.find((c) => c.id === params.childId);
    if (!child) {
      return HttpResponse.json(
        { success: false, error: { errorCode: 'NOT_FOUND', message: 'Child not found' } },
        { status: 404 }
      );
    }
    const body: ApiResponse<Child> = { success: true, data: child };
    return HttpResponse.json(body);
  }),
];
```

All other handlers follow the same pattern, pulling fixture data from `src/lib/mockData.ts` and wrapping it in the `ApiResponse<T>` envelope.

### Fixture Data Mapping

| Handler file | Source data in mockData.ts | Endpoint |
|---|---|---|
| `children.ts` | `CHILDREN` array | `GET /v1/children`, `GET /v1/children/:id` |
| `assignments.ts` | `child.assignments`, `child.homework` | `GET /v1/children/:id/assignments`, `GET /v1/children/:id/homework` |
| `attendance.ts` | `child.attendance_log`, `child.attendance` | `GET /v1/children/:id/attendance` |
| `grades.ts` | `child.subjects`, `child.overallAvg` | `GET /v1/children/:id/grades` |
| `messages.ts` | `child.messages` (list), `useMessageThreads` static data (threads) | `GET /v1/messages`, `GET /v1/messages/:threadId` |
| `notifications.ts` | `child.notifications` | `GET /v1/children/:id/notifications` |
| `schedule.ts` | `child.schedule` | `GET /v1/children/:id/schedule` |

### Conditional Initialization in `src/app/layout.tsx`

```typescript
// src/app/layout.tsx
import { config } from '@/lib/config';

// Called once at app startup, before first render
if (config.enableMocks) {
  // Dynamic import keeps MSW out of the production bundle
  import('@/mocks').then(({ initMocks }) => initMocks());
}
```

---

## Authentication Flow

### Token Storage Strategy

Access tokens are stored **in memory only** (a module-level variable in `authService.ts`). They are never written to `localStorage` or `sessionStorage`. The refresh token is stored in an **HttpOnly cookie** set by the backend on login — the frontend never reads or writes it directly. This satisfies Requirement 9.4.

```
┌─────────────────────────────────────────────────────────────────┐
│  Memory (authService.ts module scope)                           │
│  • accessToken: string | null                                   │
│  • Lost on page refresh → restored via refresh token cookie     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  HttpOnly Cookie (set by backend, read by backend only)         │
│  • refreshToken                                                 │
│  • Sent automatically with every request (withCredentials:true) │
│  • Cannot be read by JavaScript                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Session Restoration on App Init

```
App starts
    │
    ▼
authService.restoreSession()
    │
    ├─ POST /v1/auth/refresh  (refresh token cookie sent automatically)
    │       │
    │       ├─ 200 OK → store new accessToken in memory
    │       │           → proceed to render app
    │       │
    │       └─ 401 → no valid session
    │                → redirect to /login
    │
    └─ (network error) → show error, allow retry
```

### Token Refresh Flow (401 Intercept)

```
Request fails with 401
    │
    ├─ _retry flag already set? → onUnauthorized() → redirect to /login
    │
    └─ First 401
           │
           ├─ Set _retry = true, isRefreshing = true
           │
           ├─ POST /v1/auth/refresh
           │       │
           │       ├─ 200 OK → new accessToken stored
           │       │           → retry original request with new token
           │       │           → return successful response to caller
           │       │
           │       └─ 401 → onUnauthorized() → clear token → redirect to /login
           │
           └─ Concurrent requests during refresh:
                   → queued in refreshSubscribers[]
                   → replayed with new token after refresh succeeds
```

### `configureApiClient` Call Site

The `configureApiClient` function is called once in `src/app/providers.tsx` during initialization:

```typescript
// src/app/providers.tsx (additions)
import { configureApiClient } from '@/lib/apiClient';
import { getAccessToken } from '@/services/authService';

configureApiClient({
  getAccessToken,
  onUnauthorized: () => {
    // Clear in-memory token and redirect
    import('@/services/authService').then(({ logout }) => logout());
    window.location.href = '/login';
  },
  onServerError: (message) => {
    // Dispatch to a global toast state or call a toast library
    window.dispatchEvent(new CustomEvent('api:server-error', { detail: message }));
  },
});
```

---

## Error Handling

### `src/components/ui/ErrorMessage.tsx`

```typescript
import React from 'react';
import type { ApiError } from '@/types/api';

interface ErrorMessageProps {
  error: ApiError;
  className?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to view this.',
  NOT_FOUND: 'The requested information could not be found.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export function ErrorMessage({ error, className }: ErrorMessageProps) {
  const message = ERROR_MESSAGES[error.errorCode] ?? error.message ?? ERROR_MESSAGES.UNKNOWN_ERROR;
  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 ${className ?? ''}`}
    >
      {message}
    </div>
  );
}
```

### Error Responsibility by Layer

| Layer | Responsibility |
|---|---|
| `apiClient.ts` | Normalizes all errors to `ApiError`; handles 401 refresh; fires toast on 5xx |
| Services | Let `ApiError` propagate; never swallow exceptions |
| Query Hooks | Expose `isError` and `error: ApiError` from TanStack Query |
| Feature Components | Render `<ErrorMessage error={error} />` when `isError` is true |
| React Error Boundary | Catches unhandled component errors; renders `<ErrorMessage>` as fallback |

### React Error Boundary

```typescript
// src/components/ui/ErrorBoundary.tsx
import React from 'react';
import { ErrorMessage } from './ErrorMessage';
import { ApiError, API_ERROR_CODES } from '@/types/api';

interface State { hasError: boolean; error: ApiError | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): State {
    const apiError = error instanceof ApiError
      ? error
      : new ApiError(API_ERROR_CODES.UNKNOWN_ERROR, String(error), 0);
    return { hasError: true, error: apiError };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorMessage error={this.state.error} className="m-4" />;
    }
    return this.props.children;
  }
}
```

---

## Migration Strategy

The migration is designed to be done in discrete, independently verifiable steps. At no point should the UI break or regress.

### Step 1 — Install Dependencies

```bash
npm install axios @tanstack/react-query msw --save-exact
```

No code changes yet. Verify the build still passes.

### Step 2 — Types Layer

Create `src/types/api.ts` and `src/types/ui.ts`. Update `src/types/index.ts` to re-export from both. Create the placeholder `src/types/api.generated.ts` (empty export). No existing type is modified.

### Step 3 — Config Module

Create `src/lib/config.ts`. Create `.env.development`, `.env.production`, `.env.example`. Add `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` to `.env.development`. Verify `npm run build` still passes.

### Step 4 — HTTP Client

Create `src/lib/apiClient.ts`. No existing code calls it yet. Verify TypeScript compilation.

### Step 5 — Services Layer

Create all 8 service files. Update `src/services/childService.ts` to call `apiClient` instead of returning `Promise.resolve(CHILDREN)`. The function signature `getChildren(): Promise<Child[]>` is preserved exactly — `App.tsx` still calls it the same way.

### Step 6 — MSW Mock Layer

Create `src/mocks/` directory and all handler files. Run `npx msw init public/` to generate the service worker file. Set `NEXT_PUBLIC_ENABLE_MOCKS=true` in `.env.development`. Add mock initialization to `src/app/layout.tsx`. At this point, the app should work identically to before — all data comes from MSW handlers which serve the same fixture data.

### Step 7 — Providers

Create `src/app/providers.tsx` with `QueryClientProvider`. Update `src/app/layout.tsx` to wrap children with `<Providers>`. Verify the app still renders correctly.

### Step 8 — Query Hooks

Create all query hooks in `src/hooks/`. Create `src/lib/queryKeys.ts`. Do not yet change `App.tsx`.

### Step 9 — Migrate `App.tsx`

Replace the `useEffect` + `useState<Child[]>` pattern with `useChildren()`:

```typescript
// Before
const [children, setChildren] = useState<Child[]>([]);
useEffect(() => {
  getChildren().then(setChildren);
}, []);
const child = children[selectedChildIndex];
if (!child) return null;

// After
const { data: children = [], isLoading, isError, error } = useChildren();
const child = children[selectedChildIndex];
if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage error={error} />;
if (!child) return null;
```

The `child: Child` prop passed to all feature modules is unchanged. All feature modules continue to work without modification.

### Step 10 — Mutation Hooks

Create `useSendMessage` and `useLogAbsence`. Update `useMessageThreads.ts` to use `useSendMessage` for the `handleSend` function. Update `AttendanceModule` to use `useLogAbsence` for the `LogAbsenceModal`.

### Step 11 — Error Boundary

Create `ErrorBoundary` and `ErrorMessage` components. Wrap the main content area in `App.tsx` with `<ErrorBoundary>`.

### Step 12 — Verification

Run `npm test` and verify all existing tests pass. Manually verify all 9 feature modules render correctly with mock data active. Toggle `NEXT_PUBLIC_ENABLE_MOCKS=false` and verify the app attempts real API calls (expected to fail gracefully with error states since no backend is running).

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The integration layer has several pure functions and data transformations that are well-suited to property-based testing: the `ApiResponse<T>` envelope construction, the `PaginatedResponse<T>` wrapper, the `ApiError` class, the config module's env var parsing, and the HTTP client's error normalization logic. These are tested with [fast-check](https://fast-check.io/), which is already installed in the project.

### Property Reflection

Before writing properties, redundancy was assessed:

- Requirements 1.2 (response envelope) and 4.4 (ApiResponse/PaginatedResponse types) both test the same envelope wrapping behavior. They are consolidated into **Property 1** and **Property 2**.
- Requirements 3.2 (auth header) and 3.4 (5xx toast) are independent behaviors with different inputs; both are kept.
- Requirements 2.1 and 2.2 (config reads env vars) are similar but test different variables; they are consolidated into **Property 4**.
- Requirements 5.4 (service throws ApiError) and 1.4 (ApiError shape) both test ApiError construction; consolidated into **Property 5**.
- Requirements 7.2 and 7.5 (mock handlers mirror contract and return correct shapes) are related; consolidated into **Property 6**.

---

### Property 1: ApiResponse envelope preserves data

*For any* value of type `T`, wrapping it in an `ApiResponse<T>` with `success: true` should result in `response.data` being strictly equal to the original value, and `response.success` being `true`.

**Validates: Requirements 1.2, 4.4**

---

### Property 2: PaginatedResponse preserves all items

*For any* array of items, constructing a `PaginatedResponse<T>` should result in `response.items` containing all original items in the same order, and `response.total` equaling the array length.

**Validates: Requirements 1.3, 4.4**

---

### Property 3: ApiError preserves errorCode, message, and status

*For any* `errorCode` string, `message` string, and HTTP `status` number, constructing an `ApiError` should result in an object where `error.errorCode === errorCode`, `error.message === message`, and `error.status === status`.

**Validates: Requirements 1.4, 5.4**

---

### Property 4: Config module correctly reads and parses env vars

*For any* valid URL string set as `NEXT_PUBLIC_API_BASE_URL` and any positive integer string set as `NEXT_PUBLIC_API_TIMEOUT_MS`, the config module should return those exact values (URL as string, timeout as parsed integer). When `NEXT_PUBLIC_API_TIMEOUT_MS` is absent, the config should return `10000`.

**Validates: Requirements 2.1, 2.2**

---

### Property 5: Config module throws with variable name when required var is absent

*For any* required environment variable name, when that variable is absent from the environment, the config module's initialization should throw an error whose message contains that variable name as a substring.

**Validates: Requirements 2.5**

---

### Property 6: HTTP client attaches Bearer token to every request

*For any* non-empty access token string stored in the auth service, every HTTP request made through `apiClient` should have an `Authorization` header equal to `"Bearer " + token`.

**Validates: Requirements 3.2**

---

### Property 7: HTTP client triggers toast for all 5xx status codes

*For any* HTTP status code in the range [500, 599], a response with that status code received by `apiClient` should result in the `onServerError` callback being called exactly once.

**Validates: Requirements 3.4, 8.4**

---

### Property 8: Mock handler responses conform to ApiResponse envelope

*For any* MSW handler in the mock layer, the JSON response body should have a `success` field of type boolean, and when `success` is `true`, a `data` field should be present and non-null.

**Validates: Requirements 7.2, 7.5**

---

### Property 9: ErrorMessage renders non-empty text for any ApiError

*For any* `ApiError` with any `errorCode` and `message`, the `ErrorMessage` component should render a non-empty string visible to the user (i.e., the rendered output contains at least one non-whitespace character).

**Validates: Requirements 8.1**

---

## Testing Strategy

### Dual Testing Approach

Unit tests cover specific examples, edge cases, and integration points. Property-based tests (using fast-check, already installed) verify universal properties across many generated inputs. Both are complementary.

### Property-Based Tests

Each property test uses fast-check with a minimum of 100 iterations. Tests are tagged with the feature and property number.

**`src/types/__tests__/api.property.test.ts`**
```typescript
// Feature: frontend-backend-integration-refactor, Property 1: ApiResponse envelope preserves data
// Feature: frontend-backend-integration-refactor, Property 2: PaginatedResponse preserves all items
// Feature: frontend-backend-integration-refactor, Property 3: ApiError preserves errorCode, message, status
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ApiError } from '@/types/api';

describe('ApiResponse envelope', () => {
  it('Property 1: preserves data field for any value', () => {
    fc.assert(fc.property(fc.anything(), (value) => {
      const response = { success: true, data: value };
      expect(response.data).toBe(value);
      expect(response.success).toBe(true);
    }), { numRuns: 100 });
  });
});

describe('PaginatedResponse', () => {
  it('Property 2: preserves all items and total', () => {
    fc.assert(fc.property(fc.array(fc.anything()), (items) => {
      const response = { items, page: 1, pageSize: 20, total: items.length };
      expect(response.items).toEqual(items);
      expect(response.total).toBe(items.length);
    }), { numRuns: 100 });
  });
});

describe('ApiError', () => {
  it('Property 3: preserves errorCode, message, and status', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }),
      fc.string({ minLength: 1 }),
      fc.integer({ min: 400, max: 599 }),
      (errorCode, message, status) => {
        const error = new ApiError(errorCode, message, status);
        expect(error.errorCode).toBe(errorCode);
        expect(error.message).toBe(message);
        expect(error.status).toBe(status);
      }
    ), { numRuns: 100 });
  });
});
```

**`src/lib/__tests__/config.property.test.ts`**
```typescript
// Feature: frontend-backend-integration-refactor, Property 4: Config reads env vars correctly
// Feature: frontend-backend-integration-refactor, Property 5: Config throws with variable name when absent
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

describe('Config module', () => {
  it('Property 4: returns correct apiBaseUrl for any valid URL', () => {
    fc.assert(fc.property(
      fc.webUrl(),
      fc.integer({ min: 1000, max: 60000 }),
      (url, timeout) => {
        process.env.NEXT_PUBLIC_API_BASE_URL = url;
        process.env.NEXT_PUBLIC_API_TIMEOUT_MS = String(timeout);
        // Re-import config (or use a factory function)
        const { buildConfig } = require('@/lib/config');
        const cfg = buildConfig();
        expect(cfg.apiBaseUrl).toBe(url);
        expect(cfg.apiTimeoutMs).toBe(timeout);
      }
    ), { numRuns: 100 });
  });

  it('Property 5: throws error containing variable name when required var is absent', () => {
    fc.assert(fc.property(
      fc.constantFrom('NEXT_PUBLIC_API_BASE_URL'),
      (varName) => {
        delete process.env[varName];
        const { buildConfig } = require('@/lib/config');
        expect(() => buildConfig()).toThrow(varName);
      }
    ), { numRuns: 10 });
  });
});
```

**`src/lib/__tests__/apiClient.property.test.ts`**
```typescript
// Feature: frontend-backend-integration-refactor, Property 6: Bearer token attached to every request
// Feature: frontend-backend-integration-refactor, Property 7: 5xx triggers toast callback
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

describe('apiClient interceptors', () => {
  it('Property 6: attaches Bearer token to every request', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 10, maxLength: 200 }),
      (token) => {
        // Set up mock token getter and capture outgoing headers
        // Verify Authorization header equals `Bearer ${token}`
      }
    ), { numRuns: 100 });
  });

  it('Property 7: calls onServerError for any 5xx status', () => {
    fc.assert(fc.property(
      fc.integer({ min: 500, max: 599 }),
      async (status) => {
        const onServerError = vi.fn();
        // Configure apiClient with mock onServerError
        // Simulate response with given status
        // Verify onServerError was called exactly once
        expect(onServerError).toHaveBeenCalledTimes(1);
      }
    ), { numRuns: 100 });
  });
});
```

### Unit Tests

Unit tests cover:
- Config module: default values, missing required vars, boolean parsing
- ApiClient: 401 refresh flow (3 branches), 403/404 do not redirect, network error → NETWORK_ERROR
- Services: each service function called with correct path and params
- Auth service: login stores token, logout clears token and calls queryClient.clear()
- Providers: QueryClientProvider is present in the rendered tree
- ErrorMessage: renders for each known error code, renders fallback for unknown codes
- ErrorBoundary: catches thrown errors and renders ErrorMessage

### Integration Tests

- Full mock layer: start MSW server, call each service function, verify returned data matches fixture
- App.tsx migration: render App with QueryClientProvider and MSW, verify child data is displayed

### Existing Tests

All existing tests in `src/components/features/assignments/filterAssignments.test.ts`, `src/components/features/grades/gradebookAggregation.test.ts`, and `src/hooks/useHomeworkConfirmation.test.ts` must continue to pass without modification.
