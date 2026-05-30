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
export interface CompleteInvitationRequest {
  uid: string;
  token: string;
}

export interface OtpRequest {
  phone_number: string;
}

export interface OtpVerifyRequest {
  phone_number: string;
  otp_code: string;
}

export interface OtpVerifyResponse {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  parentId: string;
  parentName: string;
}

export interface ParentMeResponse {
  id: string;
  user: {
    id: string;
    name: string;
    phone_number: string;
    email?: string | null;
  };
  branch?: {
    id: string;
    name: string;
  } | null;
}

export interface UserMeResponse {
  id: string;
  name: string;
  phone_number?: string;
  email?: string | null;
}

export interface ParentStudent {
  id: string;
  first_name: string;
  last_name: string;
  section_name: string;
  grade_name: string;
}

export interface RefreshRequest {
  // Refresh token is sent via HttpOnly cookie; no body field needed
}

export interface RefreshResponse {
  access: string;
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
