import type { components } from "./generated/schema";

export type ApiErrorCode = components["schemas"]["ErrorCode"];

export type AppErrorCode = ApiErrorCode | "UNKNOWN";

const API_ERROR_CODES: readonly ApiErrorCode[] = [
  "INVALID_CREDENTIALS",
  "TOO_MANY_ATTEMPTS",
  "EMAIL_ALREADY_REGISTERED",
  "RESET_TOKEN_INVALID",
  "UNAUTHENTICATED",
];

const isApiErrorCode = (value: unknown): value is ApiErrorCode =>
  API_ERROR_CODES.some((code) => code === value);

export const errorCodeOf = (error: unknown): AppErrorCode => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const { code } = error;
    if (isApiErrorCode(code)) {
      return code;
    }
  }
  return "UNKNOWN";
};
