import { afterEach, describe, expect, it, vi } from "vitest";

import { photoUrl, uploadPhoto } from "./photos";
import { UNAUTHORIZED_EVENT, authEvents } from "./unauthorized";

type Listener = (event: ProgressEvent) => void;

class FakeXhr {
  static last: FakeXhr | undefined;
  method = "";
  url = "";
  headers: Record<string, string> = {};
  sent: unknown;
  status = 0;
  responseText = "";
  private listeners: Record<string, Listener[]> = {};
  private uploadListeners: Record<string, Listener[]> = {};
  upload = {
    addEventListener: (type: string, listener: Listener) => {
      (this.uploadListeners[type] ??= []).push(listener);
    },
  };

  constructor() {
    FakeXhr.last = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  addEventListener(type: string, listener: Listener) {
    (this.listeners[type] ??= []).push(listener);
  }

  send(body: unknown) {
    this.sent = body;
  }

  abort() {
    this.emit("abort");
  }

  progress(loaded: number, total: number) {
    for (const listener of this.uploadListeners["progress"] ?? []) {
      listener(new ProgressEvent("progress", { lengthComputable: true, loaded, total }));
    }
  }

  respond(status: number, body: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.emit("load");
  }

  emit(type: string) {
    for (const listener of this.listeners[type] ?? []) {
      listener(new ProgressEvent(type));
    }
  }
}

const lastRequest = (): FakeXhr => {
  if (FakeXhr.last === undefined) {
    throw new Error("No request sent");
  }
  return FakeXhr.last;
};

afterEach(() => {
  vi.unstubAllGlobals();
  FakeXhr.last = undefined;
});

describe("uploadPhoto", () => {
  it("sends the raw file and reports progress", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    const progress = vi.fn<(fraction: number) => void>();
    const file = new Blob(["jpeg"]);

    const pending = uploadPhoto(file, progress);
    const request = lastRequest();
    request.progress(40, 100);
    request.respond(201, { id: "p1", width: 1600, height: 1200 });

    await expect(pending).resolves.toEqual({
      ok: true,
      photo: { id: "p1", width: 1600, height: 1200 },
    });
    expect(request.method).toBe("POST");
    expect(request.url).toBe("/api/photos");
    expect(request.headers["Content-Type"]).toBe("application/octet-stream");
    expect(request.sent).toBe(file);
    expect(progress).toHaveBeenCalledWith(0.4);
  });

  it("returns the error body of a rejected upload", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);

    const pending = uploadPhoto(new Blob(["x"]), () => undefined);
    lastRequest().respond(413, { code: "PHOTO_TOO_LARGE", message: "x" });

    await expect(pending).resolves.toEqual({
      ok: false,
      status: 413,
      body: { code: "PHOTO_TOO_LARGE", message: "x" },
    });
  });

  it("signals an expired session", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    const listener = vi.fn<() => void>();
    authEvents.addEventListener(UNAUTHORIZED_EVENT, listener);

    const pending = uploadPhoto(new Blob(["x"]), () => undefined);
    lastRequest().respond(401, { code: "UNAUTHENTICATED", message: "x" });
    await pending;

    authEvents.removeEventListener(UNAUTHORIZED_EVENT, listener);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("can be cancelled", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    const controller = new AbortController();

    const pending = uploadPhoto(new Blob(["x"]), () => undefined, controller.signal);
    controller.abort();

    await expect(pending).resolves.toEqual({ ok: false, status: 0, body: undefined });
  });
});

describe("photoUrl", () => {
  it("points to the photo endpoint with the requested size", () => {
    expect(photoUrl("abc", "thumb")).toBe("/api/photos/abc?size=thumb");
    expect(photoUrl("abc", "full")).toBe("/api/photos/abc?size=full");
  });
});
