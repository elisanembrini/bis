import { type ApiErrorCode, isApiErrorCode } from "../../api/errors";

export const sanitizeRedirect = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return undefined;
  }
  return value;
};

export type RedirectSearch = { redirect?: string };

export const validateRedirectSearch = (search: Record<string, unknown>): RedirectSearch => {
  const redirect = sanitizeRedirect(search["redirect"]);
  return redirect === undefined ? {} : { redirect };
};

export type LoginSearch = RedirectSearch & { error?: ApiErrorCode };

export const validateLoginSearch = (search: Record<string, unknown>): LoginSearch => {
  const error = search["error"];
  return {
    ...validateRedirectSearch(search),
    ...(isApiErrorCode(error) ? { error } : {}),
  };
};
