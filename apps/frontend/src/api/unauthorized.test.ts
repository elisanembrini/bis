import createFetchClient from "openapi-fetch";
import { describe, expect, it, vi } from "vitest";

import type { paths } from "./generated/schema";
import {
  UNAUTHORIZED_EVENT,
  authEvents,
  shouldNotifyUnauthorized,
  unauthorizedMiddleware,
} from "./unauthorized";

describe("shouldNotifyUnauthorized", () => {
  it("notifies a 401 from a protected endpoint", () => {
    expect(shouldNotifyUnauthorized("/recipes", 401)).toBe(true);
  });

  it("ignores other statuses", () => {
    expect(shouldNotifyUnauthorized("/recipes", 403)).toBe(false);
    expect(shouldNotifyUnauthorized("/recipes", 200)).toBe(false);
  });

  it("ignores auth endpoints and /me, which handle 401 themselves", () => {
    expect(shouldNotifyUnauthorized("/auth/login", 401)).toBe(false);
    expect(shouldNotifyUnauthorized("/auth/logout", 401)).toBe(false);
    expect(shouldNotifyUnauthorized("/me", 401)).toBe(false);
  });
});

const clientRespondingWith = (status: number) => {
  const client = createFetchClient<paths>({
    baseUrl: "http://localhost/api",
    fetch: () => Promise.resolve(new Response("{}", { status })),
  });
  client.use(unauthorizedMiddleware);
  return client;
};

describe("unauthorizedMiddleware", () => {
  it("dispatches UNAUTHORIZED_EVENT when a protected endpoint answers 401", async () => {
    const listener = vi.fn<() => void>();
    authEvents.addEventListener(UNAUTHORIZED_EVENT, listener);

    await clientRespondingWith(401).GET("/health");
    await clientRespondingWith(401).GET("/me");
    await clientRespondingWith(200).GET("/health");

    authEvents.removeEventListener(UNAUTHORIZED_EVENT, listener);
    expect(listener).toHaveBeenCalledOnce();
  });
});
