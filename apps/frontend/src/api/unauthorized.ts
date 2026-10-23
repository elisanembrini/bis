import type { Middleware } from "openapi-fetch";

export const UNAUTHORIZED_EVENT = "bis:unauthorized";

export const authEvents = new EventTarget();

export const shouldNotifyUnauthorized = (schemaPath: string, status: number): boolean =>
  status === 401 && schemaPath !== "/me" && !schemaPath.startsWith("/auth/");

export const unauthorizedMiddleware: Middleware = {
  onResponse({ schemaPath, response }) {
    if (shouldNotifyUnauthorized(schemaPath, response.status)) {
      authEvents.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return undefined;
  },
};
