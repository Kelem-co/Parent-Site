# API Contract — Kelem Parent Portal

**Version:** 1.0  
**Last Updated:** 2025  
**Base Path Prefix:** `/v1`  
**Base URL:** Controlled by `NEXT_PUBLIC_API_BASE_URL` environment variable.

> **Development default:** `http://localhost:4000`  
> **Production default:** `https://api.kelem.school`

This document is the single source of truth for every HTTP endpoint the Kelem Parent Portal frontend consumes. A backend developer should be able to implement all endpoints from this document alone, without needing to read frontend source code.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Standard Response Envelope](#standard-response-envelope)
3. [Pagination Contract](#pagination-contract)
4. [Error Response Format](#error-response-format)
5. [Error Codes Reference](#error-codes-reference)
6. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [Children](#children-endpoints)
   - [Assignments](#assignments-endpoints)
   - [Homework](#homework-endpoints)
   - [Attendance](#attendance-endpoints)
   - [Grades](#grades-endpoints)
   - [Messages](#messages-endpoints)
   - [Notifications](#notifications-endpoints)
   - [Schedule](#schedule-endpoints)
7. [Data Models](#data-models)

---

## Authentication

All endpoints except `POST /v1/auth/login` require a valid session. The frontend sends a Bearer token in the `Authorization` header on every request:

```
Authorization: Bearer <accessToken>
```

The access token is obtained from `POST /v1/auth/login` and renewed via `POST /v1/auth/refresh`. The refresh token is stored in an **HttpOnly cookie** and is sent automatically by the browser — the frontend never reads or stores the refresh token in JavaScript.

**Token lifecycle:**
- Access tokens are short-lived (the `expiresIn` field in `AuthResponse` specifies the TTL in seconds).
- When the frontend receives a `401`, it automatically calls `POST /v1/auth/refresh` once and retries the original request.
- If the refresh also returns `401`, the user is redirected to the login page.
- `POST /v1/auth/logout` must invalidate both the access token and the refresh token cookie server-side.

---

## Standard Response Envelope

Every endpoint returns a JSON body conforming to this envelope. There are no exceptions.

### Success Response

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2025-06-03T09:42:00Z"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | `boolean` | Yes | Always `true` for successful responses |
| `data` | `T` | Yes | The response payload; shape varies per endpoint |
| `meta` | `object` | No | Optional metadata about the request |
| `meta.requestId` | `string` | No | Unique identifier for the request (useful for tracing) |
| `meta.timestamp` | `string` | No | ISO 8601 UTC timestamp of when the response was generated |

### Error Response

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

| Field | Type | Required | Description |
|---|---|---|---|
| `success` | `boolean` | Yes | Always `false` for error responses |
| `error` | `object` | Yes | Error details object |
| `error.errorCode` | `string` | Yes | Machine-readable error code (see [Error Codes Reference](#error-codes-reference)) |
| `error.message` | `string` | Yes | Human-readable description of the error |
| `error.details` | `object` | No | Additional structured context about the error |

---

## Pagination Contract

All list endpoints return a paginated response. The `data` field of the envelope contains a `PaginatedResponse<T>` object:

```json
{
  "success": true,
  "data": {
    "items": [ ],
    "page": 1,
    "pageSize": 20,
    "total": 3
  }
}
```

| Field | Type | Description |
|---|---|---|
| `items` | `T[]` | Array of items for the current page |
| `page` | `number` | Current page number (1-indexed) |
| `pageSize` | `number` | Number of items per page |
| `total` | `number` | Total number of items across all pages |

**Pagination query parameters** (accepted by all list endpoints unless noted otherwise):

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number to retrieve (1-indexed) |
| `pageSize` | `number` | `20` | Number of items per page |

---

## Error Response Format

Error responses always use the envelope described above with `success: false`. The HTTP status code and `errorCode` together identify the error type.

```json
{
  "success": false,
  "error": {
    "errorCode": "VALIDATION_ERROR",
    "message": "Request body is invalid",
    "details": {
      "field": "date",
      "issue": "Must be a valid ISO 8601 date string"
    }
  }
}
```

The `details` field is optional but should be included whenever it helps the client understand or recover from the error (e.g., which field failed validation, which resource was not found).

---

## Error Codes Reference

| `errorCode` | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | `401` | Missing or invalid access token; session has expired |
| `FORBIDDEN` | `403` | Authenticated but not permitted to access this resource |
| `NOT_FOUND` | `404` | The requested resource does not exist |
| `VALIDATION_ERROR` | `422` | Request body or query parameters failed validation |
| `SERVER_ERROR` | `500` | Unexpected server-side error |
| `NETWORK_ERROR` | — | Client-side only; never returned by the server |
| `UNKNOWN_ERROR` | any | Fallback when no specific code applies |

---

## Endpoints

### Endpoint Summary

| Method | Path | Description |
|---|---|---|
| `POST` | `/v1/auth/login` | Authenticate a parent |
| `POST` | `/v1/auth/logout` | Invalidate the current session |
| `POST` | `/v1/auth/refresh` | Refresh the access token |
| `GET` | `/v1/children` | List all children for the authenticated parent |
| `GET` | `/v1/children/:childId` | Get a single child's full profile |
| `GET` | `/v1/children/:childId/assignments` | List assignments for a child |
| `GET` | `/v1/children/:childId/homework` | List homework entries for a child |
| `GET` | `/v1/children/:childId/attendance` | Get attendance log and summary for a child |
| `POST` | `/v1/children/:childId/attendance/absence` | Log a parent-reported absence |
| `GET` | `/v1/children/:childId/grades` | Get subject grades for a child |
| `GET` | `/v1/messages` | List message threads for the parent |
| `GET` | `/v1/messages/:threadId` | Get all messages in a thread |
| `POST` | `/v1/messages/:threadId/reply` | Send a reply in a thread |
| `GET` | `/v1/children/:childId/notifications` | List notifications for a child |
| `GET` | `/v1/children/:childId/schedule` | Get the weekly schedule for a child |

---

### Auth Endpoints

---

#### `POST /v1/auth/login`

Authenticate a parent with email and password. Returns an access token and session metadata. The refresh token is set as an HttpOnly cookie by the server — it is not included in the response body.

**Request Body:**

```json
{
  "email": "parent@example.com",
  "password": "s3cur3P@ssword"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | Yes | Parent's registered email address |
| `password` | `string` | Yes | Parent's password |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "parentId": "PAR-00123",
    "parentName": "Abebe Kebede"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `accessToken` | `string` | JWT access token to include in subsequent requests |
| `expiresIn` | `number` | Access token TTL in seconds |
| `parentId` | `string` | Unique identifier for the authenticated parent |
| `parentName` | `string` | Display name of the authenticated parent |

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Invalid email or password |
| `422` | `VALIDATION_ERROR` | Missing or malformed request fields |

---

#### `POST /v1/auth/logout`

Invalidate the current session. The server must clear the HttpOnly refresh token cookie and revoke the access token server-side.

**Request Body:** None

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": null
}
```

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | No valid session to invalidate |

---

#### `POST /v1/auth/refresh`

Exchange the HttpOnly refresh token cookie for a new access token. The refresh token is sent automatically by the browser via the cookie — no request body is needed.

**Request Body:** None (refresh token is sent via HttpOnly cookie)

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "parentId": "PAR-00123",
    "parentName": "Abebe Kebede"
  }
}
```

Response shape is identical to `POST /v1/auth/login`.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Refresh token is missing, expired, or revoked |

---

### Children Endpoints

---

#### `GET /v1/children`

List all children associated with the authenticated parent's account.

**Query Parameters:** None (pagination parameters accepted but typically all children fit on one page)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `20` | Items per page |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "STU-00101",
        "name": "Liya Kebede",
        "initials": "LK",
        "grade": "Grade 5",
        "section": "A",
        "overallAvg": 88,
        "attendance": 95,
        "assignmentsDue": 2,
        "missingWork": 0,
        "subjects": [],
        "attendance_log": [],
        "homework": [],
        "assignments": [],
        "messages": [],
        "notifications": [],
        "schedule": []
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 3
  }
}
```

The `items` array contains `Child` objects. See [Child](#child) in the Data Models section for the full field reference.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |

---

#### `GET /v1/children/:childId`

Get the full profile for a single child.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `childId` | `string` | Unique identifier of the child (e.g., `STU-00101`) |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "STU-00101",
    "name": "Liya Kebede",
    "initials": "LK",
    "grade": "Grade 5",
    "section": "A",
    "overallAvg": 88,
    "attendance": 95,
    "assignmentsDue": 2,
    "missingWork": 0,
    "subjects": [ ],
    "attendance_log": [ ],
    "homework": [ ],
    "assignments": [ ],
    "messages": [ ],
    "notifications": [ ],
    "schedule": [ ]
  }
}
```

See [Child](#child) in the Data Models section for the full field reference.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | The authenticated parent does not have access to this child |
| `404` | `NOT_FOUND` | No child exists with the given `childId` |

---

### Assignments Endpoints

---

#### `GET /v1/children/:childId/assignments`

List all assignments for a child, with optional status filtering and pagination.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `childId` | `string` | Unique identifier of the child |

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `status` | `string` | — | Filter by status: `graded`, `completed`, `due`, `pending`, `missing` |
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `20` | Items per page |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ASN-001",
        "title": "Chapter 5 Review",
        "subject": "Mathematics",
        "subjectColor": "#4F46E5",
        "type": "Worksheet",
        "dueDate": "2025-06-10",
        "status": "due",
        "score": null,
        "maxScore": 100,
        "description": "Complete exercises 1–20 from the textbook."
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 8
  }
}
```

See [AssignmentEntry](#assignmententry) in the Data Models section for the full field reference.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this child |
| `404` | `NOT_FOUND` | Child not found |

---

### Homework Endpoints

---

#### `GET /v1/children/:childId/homework`

List homework entries for a child. Homework entries represent submitted or graded work, distinct from upcoming assignments.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `childId` | `string` | Unique identifier of the child |

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `20` | Items per page |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "HW-001",
        "title": "Reading Comprehension Quiz",
        "subject": "English",
        "subjectColor": "#10B981",
        "date": "2025-06-01",
        "score": 18,
        "maxScore": 20,
        "status": "graded",
        "type": "Quiz"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 12
  }
}
```

See [HomeworkEntry](#homeworkentry) in the Data Models section for the full field reference.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this child |
| `404` | `NOT_FOUND` | Child not found |

---

### Attendance Endpoints

---

#### `GET /v1/children/:childId/attendance`

Get the attendance log and summary statistics for a child. Optionally filter by date range.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `childId` | `string` | Unique identifier of the child |

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `from` | `string` | — | Start date filter (ISO 8601, e.g. `2025-01-01`) |
| `to` | `string` | — | End date filter (ISO 8601, e.g. `2025-06-30`) |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "log": [
      { "date": "2025-06-02", "status": "present" },
      { "date": "2025-06-03", "status": "absent" },
      { "date": "2025-06-04", "status": "late" }
    ],
    "termAttendance": 95,
    "daysPresent": 85,
    "totalDays": 90,
    "absences": 3,
    "lates": 2
  }
}
```

| Field | Type | Description |
|---|---|---|
| `log` | `AttendanceLogEntry[]` | Day-by-day attendance records |
| `termAttendance` | `number` | Attendance percentage for the current term (0–100) |
| `daysPresent` | `number` | Number of days the child was present |
| `totalDays` | `number` | Total school days in the period |
| `absences` | `number` | Number of absent days |
| `lates` | `number` | Number of late arrivals |

See [AttendanceLogEntry](#attendancelogentry) for the log entry shape.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this child |
| `404` | `NOT_FOUND` | Child not found |

---

#### `POST /v1/children/:childId/attendance/absence`

Log a parent-reported absence for a child. Used when a parent proactively notifies the school of an upcoming or same-day absence.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `childId` | `string` | Unique identifier of the child |

**Request Body:**

```json
{
  "date": "2025-06-10",
  "reason": "Doctor's appointment"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | `string` | Yes | ISO 8601 date of the absence (e.g. `2025-06-10`) |
| `reason` | `string` | No | Optional reason for the absence |

**Success Response — `201 Created`:**

```json
{
  "success": true,
  "data": {
    "date": "2025-06-10",
    "status": "absent"
  }
}
```

The response is the newly created `AttendanceLogEntry`. See [AttendanceLogEntry](#attendancelogentry).

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this child |
| `404` | `NOT_FOUND` | Child not found |
| `422` | `VALIDATION_ERROR` | `date` is missing or not a valid ISO 8601 date |

---

### Grades Endpoints

---

#### `GET /v1/children/:childId/grades`

Get subject grades and the overall average for a child.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `childId` | `string` | Unique identifier of the child |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "name": "Mathematics",
        "score": 92,
        "color": "#4F46E5",
        "teacher": "Mr. Tadesse"
      },
      {
        "name": "English",
        "score": 85,
        "color": "#10B981",
        "teacher": "Ms. Almaz"
      }
    ],
    "overallAvg": 88
  }
}
```

| Field | Type | Description |
|---|---|---|
| `subjects` | `Subject[]` | Array of subject grade records |
| `overallAvg` | `number` | Weighted or simple average across all subjects (0–100) |

See [Subject](#subject) for the subject shape.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this child |
| `404` | `NOT_FOUND` | Child not found |

---

### Messages Endpoints

---

#### `GET /v1/messages`

List all message threads for the authenticated parent, across all children and teachers.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `20` | Items per page |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "THR-001",
        "teacherName": "Mr. Tadesse",
        "teacherInitials": "MT",
        "subject": "Mathematics",
        "preview": "Liya did very well on the last exam...",
        "time": "2025-06-03T10:15:00Z",
        "unread": true,
        "avatarColor": "#4F46E5"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 5
  }
}
```

See [MessageEntry](#messageentry) for the full field reference.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |

---

#### `GET /v1/messages/:threadId`

Get all messages within a specific thread, grouped by date.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `threadId` | `string` | Unique identifier of the message thread |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "dateGroup": "June 3, 2025",
    "messages": [
      {
        "sender": "teacher",
        "text": "Liya did very well on the last exam. Keep it up!",
        "time": "2025-06-03T10:15:00Z",
        "readAt": "2025-06-03T10:20:00Z"
      },
      {
        "sender": "parent",
        "text": "Thank you for letting me know!",
        "time": "2025-06-03T10:25:00Z",
        "readAt": null
      }
    ]
  }
}
```

See [MessageThread](#messagethread) and [ThreadMessage](#threadmessage) for the full field reference.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this thread |
| `404` | `NOT_FOUND` | Thread not found |

---

#### `POST /v1/messages/:threadId/reply`

Send a reply message in an existing thread.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `threadId` | `string` | Unique identifier of the message thread |

**Request Body:**

```json
{
  "text": "Thank you for the update!"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `text` | `string` | Yes | The message text to send. Must not be empty. |

**Success Response — `201 Created`:**

```json
{
  "success": true,
  "data": {
    "sender": "parent",
    "text": "Thank you for the update!",
    "time": "2025-06-03T11:00:00Z",
    "readAt": null
  }
}
```

The response is the newly created `ThreadMessage`. See [ThreadMessage](#threadmessage).

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this thread |
| `404` | `NOT_FOUND` | Thread not found |
| `422` | `VALIDATION_ERROR` | `text` is missing or empty |

---

### Notifications Endpoints

---

#### `GET /v1/children/:childId/notifications`

List notifications for a child, with optional read/unread filtering and pagination.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `childId` | `string` | Unique identifier of the child |

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `read` | `boolean` | — | Filter by read status: `true` for read, `false` for unread |
| `page` | `number` | `1` | Page number |
| `pageSize` | `number` | `20` | Items per page |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "NTF-001",
        "title": "Absence Recorded",
        "type": "info",
        "category": "attendance",
        "time": "2025-06-03T08:00:00Z",
        "read": false,
        "detail": "Liya was marked absent on June 3rd.",
        "icon": "calendar",
        "color": "#F59E0B"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 7
  }
}
```

See [NotificationEntry](#notificationentry) for the full field reference.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this child |
| `404` | `NOT_FOUND` | Child not found |

---

### Schedule Endpoints

---

#### `GET /v1/children/:childId/schedule`

Get the weekly class schedule for a child.

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `childId` | `string` | Unique identifier of the child |

**Success Response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "SCH-001",
        "subject": "Mathematics",
        "time": "08:00 – 09:00",
        "room": "Room 12",
        "teacher": "Mr. Tadesse",
        "color": "#4F46E5",
        "type": "Core"
      }
    ],
    "page": 1,
    "pageSize": 50,
    "total": 10
  }
}
```

See [ScheduleEntry](#scheduleentry) for the full field reference.

**Error Responses:**

| Status | `errorCode` | Condition |
|---|---|---|
| `401` | `UNAUTHORIZED` | Missing or expired access token |
| `403` | `FORBIDDEN` | Parent does not have access to this child |
| `404` | `NOT_FOUND` | Child not found |

---

## Data Models

All TypeScript types are defined in `src/types/`. This section documents every shape used in request and response bodies.

---

### `Child`

Returned by `GET /v1/children` (as array items) and `GET /v1/children/:childId`.

```typescript
interface Child {
  id: string;               // Unique student identifier, e.g. "STU-00101"
  name: string;             // Full display name, e.g. "Liya Kebede"
  initials: string;         // Two-letter initials for avatar, e.g. "LK"
  grade: string;            // Grade label, e.g. "Grade 5"
  section: string;          // Section/class label, e.g. "A"
  overallAvg: number;       // Overall grade average (0–100)
  attendance: number;       // Attendance percentage (0–100)
  assignmentsDue: number;   // Count of upcoming assignments due
  missingWork: number;      // Count of missing/overdue assignments
  subjects: Subject[];
  attendance_log: AttendanceLogEntry[];
  homework: HomeworkEntry[];
  assignments: AssignmentEntry[];
  messages: MessageEntry[];
  notifications: NotificationEntry[];
  schedule: ScheduleEntry[];
}
```

> **Note:** The nested arrays (`subjects`, `attendance_log`, etc.) on the `Child` object are summary/preview data. For full paginated lists, use the dedicated endpoints (e.g., `GET /v1/children/:childId/assignments`).

---

### `Subject`

Used within `Child.subjects` and returned by `GET /v1/children/:childId/grades`.

```typescript
interface Subject {
  name: string;     // Subject name, e.g. "Mathematics"
  score: number;    // Current grade score (0–100)
  color: string;    // Hex color for UI display, e.g. "#4F46E5"
  teacher: string;  // Teacher's name, e.g. "Mr. Tadesse"
}
```

---

### `AttendanceLogEntry`

Used within `Child.attendance_log` and returned by `GET /v1/children/:childId/attendance` (inside `log[]`) and `POST /v1/children/:childId/attendance/absence`.

```typescript
interface AttendanceLogEntry {
  date: string;    // ISO 8601 date, e.g. "2025-06-03"
  status: 'present' | 'absent' | 'late' | 'no-school' | 'empty' | string;
}
```

**Status values:**

| Value | Meaning |
|---|---|
| `present` | Child attended school |
| `absent` | Child was absent |
| `late` | Child arrived late |
| `no-school` | No school on this day (holiday, weekend) |
| `empty` | Day has no record yet (future date or data gap) |

---

### `AssignmentEntry`

Returned by `GET /v1/children/:childId/assignments`.

```typescript
interface AssignmentEntry {
  id: string;           // Unique assignment identifier
  title: string;        // Assignment title
  subject: string;      // Subject name
  subjectColor: string; // Hex color for the subject
  type: string;         // Assignment type, e.g. "Worksheet", "Project", "Quiz"
  dueDate: string;      // ISO 8601 date the assignment is due
  status: 'graded' | 'completed' | 'due' | 'pending' | 'missing' | string;
  score: number | null; // Score received (null if not yet graded)
  maxScore: number;     // Maximum possible score
  description: string;  // Assignment description or instructions
}
```

---

### `HomeworkEntry`

Returned by `GET /v1/children/:childId/homework`.

```typescript
interface HomeworkEntry {
  id: string;           // Unique homework identifier
  title: string;        // Homework title
  subject: string;      // Subject name
  subjectColor: string; // Hex color for the subject
  date: string;         // ISO 8601 date the homework was assigned or due
  score: number | null; // Score received (null if not yet graded)
  maxScore: number;     // Maximum possible score
  status: 'graded' | 'completed' | 'due' | 'pending' | 'missing' | string;
  type: string;         // Homework type, e.g. "Quiz", "Exercise"
}
```

---

### `MessageEntry`

Returned by `GET /v1/messages` (as array items).

```typescript
interface MessageEntry {
  id: string;              // Thread identifier (used in /v1/messages/:threadId)
  teacherName: string;     // Full name of the teacher in the thread
  teacherInitials: string; // Two-letter initials for avatar
  subject: string;         // Subject the thread is about
  preview: string;         // Short preview of the latest message
  time: string;            // ISO 8601 timestamp of the latest message
  unread: boolean;         // Whether the parent has unread messages in this thread
  avatarColor?: string;    // Optional hex color for the teacher avatar
}
```

---

### `MessageThread`

Returned by `GET /v1/messages/:threadId`.

```typescript
interface MessageThread {
  dateGroup: string;          // Human-readable date label, e.g. "June 3, 2025"
  messages: ThreadMessage[];  // All messages in the thread
}
```

---

### `ThreadMessage`

Individual message within a `MessageThread`. Also returned by `POST /v1/messages/:threadId/reply`.

```typescript
interface ThreadMessage {
  sender: 'teacher' | 'parent'; // Who sent the message
  text: string;                  // Message body
  time: string;                  // ISO 8601 timestamp when the message was sent
  readAt?: string;               // ISO 8601 timestamp when the message was read (null/absent if unread)
}
```

---

### `NotificationEntry`

Returned by `GET /v1/children/:childId/notifications` (as array items).

```typescript
interface NotificationEntry {
  id: string;       // Unique notification identifier
  title: string;    // Short notification title
  type: 'urgent' | 'info' | 'success' | string;
  category: 'attendance' | 'grade' | 'announcement' | 'system' | string;
  time: string;     // ISO 8601 timestamp
  read: boolean;    // Whether the parent has read this notification
  detail: string;   // Full notification body text
  icon?: string;    // Optional icon identifier for UI rendering
  color?: string;   // Optional hex color for UI rendering
}
```

---

### `ScheduleEntry`

Returned by `GET /v1/children/:childId/schedule` (as array items).

```typescript
interface ScheduleEntry {
  id: string;      // Unique schedule entry identifier
  subject: string; // Subject name
  time: string;    // Time range string, e.g. "08:00 – 09:00"
  room: string;    // Room or location, e.g. "Room 12"
  teacher: string; // Teacher's name
  color: string;   // Hex color for UI display
  type: string;    // Class type, e.g. "Core", "Elective", "Lab"
}
```

---

### `LoginRequest`

Request body for `POST /v1/auth/login`.

```typescript
interface LoginRequest {
  email: string;    // Parent's registered email address
  password: string; // Parent's password
}
```

---

### `AuthResponse`

Response `data` for `POST /v1/auth/login` and `POST /v1/auth/refresh`.

```typescript
interface AuthResponse {
  accessToken: string; // JWT access token
  expiresIn: number;   // Token TTL in seconds
  parentId: string;    // Unique identifier for the authenticated parent
  parentName: string;  // Display name of the authenticated parent
}
```

---

### `LogAbsenceRequest`

Request body for `POST /v1/children/:childId/attendance/absence`.

```typescript
interface LogAbsenceRequest {
  date: string;    // ISO 8601 date, e.g. "2025-06-10"
  reason?: string; // Optional reason for the absence
}
```

---

### `SendMessageRequest`

Request body for `POST /v1/messages/:threadId/reply`.

```typescript
interface SendMessageRequest {
  text: string; // Message body text (must not be empty)
}
```

---

### `AttendanceResponse`

Response `data` for `GET /v1/children/:childId/attendance`.

```typescript
interface AttendanceResponse {
  log: AttendanceLogEntry[]; // Day-by-day attendance records
  termAttendance: number;    // Attendance percentage for the current term (0–100)
  daysPresent: number;       // Number of days present
  totalDays: number;         // Total school days in the period
  absences: number;          // Number of absent days
  lates: number;             // Number of late arrivals
}
```

---

### `GradesResponse`

Response `data` for `GET /v1/children/:childId/grades`.

```typescript
interface GradesResponse {
  subjects: Subject[]; // Per-subject grade records
  overallAvg: number;  // Overall average across all subjects (0–100)
}
```

---

## TypeScript Source

The authoritative TypeScript definitions for all types above are in:

- **`src/types/api.ts`** — `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`, `LoginRequest`, `AuthResponse`, `LogAbsenceRequest`, `SendMessageRequest`, `AttendanceResponse`, `GradesResponse`
- **`src/types/child.ts`** — `Child`, `Subject`, `AttendanceLogEntry`, `Student`
- **`src/types/assignment.ts`** — `AssignmentEntry`, `HomeworkEntry`
- **`src/types/message.ts`** — `MessageEntry`, `MessageThread`, `ThreadMessage`
- **`src/types/notification.ts`** — `NotificationEntry`
- **`src/types/schedule.ts`** — `ScheduleEntry`

These files can be shared directly with the backend team as the canonical type definitions.
