import type { components, paths } from "./generated/schema";
import { UNAUTHORIZED_EVENT, authEvents } from "./unauthorized";

export type UploadedPhoto = components["schemas"]["PhotoUploadResponse"];
export type PhotoSize = "full" | "thumb";

const PHOTOS_PATH = "/photos" satisfies keyof paths;
const PHOTO_PATH = "/photos/{photo_id}" satisfies keyof paths;

export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export const photoUrl = (photoId: string, size: PhotoSize): string => {
  const path = PHOTO_PATH.replace("{photo_id}", encodeURIComponent(photoId));
  return `/api${path}?${new URLSearchParams({ size }).toString()}`;
};

export type UploadOutcome =
  | { ok: true; photo: UploadedPhoto }
  | { ok: false; status: number; body: unknown };

const isUploadedPhoto = (value: unknown): value is UploadedPhoto =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "width" in value &&
  typeof value.width === "number" &&
  "height" in value &&
  typeof value.height === "number";

const parseBody = (text: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return undefined;
  }
};

export const uploadPhoto = (
  file: Blob,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<UploadOutcome> =>
  new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open("POST", `/api${PHOTOS_PATH}`);
    request.setRequestHeader("Content-Type", "application/octet-stream");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(event.loaded / event.total);
      }
    });
    request.addEventListener("load", () => {
      const body = parseBody(request.responseText);
      if (request.status === 201 && isUploadedPhoto(body)) {
        resolve({ ok: true, photo: body });
        return;
      }
      if (request.status === 401) {
        authEvents.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
      resolve({ ok: false, status: request.status, body });
    });
    request.addEventListener("error", () => resolve({ ok: false, status: 0, body: undefined }));
    request.addEventListener("abort", () => resolve({ ok: false, status: 0, body: undefined }));
    signal?.addEventListener("abort", () => request.abort());
    request.send(file);
  });
