import type { components } from "./generated/schema";

export type ApiErrorCode = components["schemas"]["ErrorCode"];

export type AppErrorCode = ApiErrorCode | "UNKNOWN";

const API_ERROR_CODES = {
  INVALID_CREDENTIALS: true,
  TOO_MANY_ATTEMPTS: true,
  EMAIL_ALREADY_REGISTERED: true,
  RESET_TOKEN_INVALID: true,
  UNAUTHENTICATED: true,
  GOOGLE_UNAVAILABLE: true,
  GOOGLE_STATE_INVALID: true,
  GOOGLE_CANCELLED: true,
  GOOGLE_EMAIL_NOT_VERIFIED: true,
  GOOGLE_ACCOUNT_CONFLICT: true,
  GOOGLE_FAILED: true,
} satisfies Record<ApiErrorCode, true>;

export const isApiErrorCode = (value: unknown): value is ApiErrorCode =>
  typeof value === "string" && Object.hasOwn(API_ERROR_CODES, value);

export const errorCodeOf = (error: unknown): AppErrorCode => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const { code } = error;
    if (isApiErrorCode(code)) {
      return code;
    }
  }
  return "UNKNOWN";
};
