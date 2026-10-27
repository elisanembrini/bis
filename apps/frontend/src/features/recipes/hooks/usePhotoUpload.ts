import { useEffect, useRef, useState } from "react";

import { type AppErrorCode, errorCodeOf } from "../../../api/errors";
import { PHOTO_MAX_BYTES, uploadPhoto } from "../../../api/photos";

export type PhotoUploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; previewSrc: string }
  | { status: "error"; code: AppErrorCode };

type PhotoUploadCallbacks = {
  onUploaded: (photoId: string) => void;
  onUploadingChange?: ((uploading: boolean) => void) | undefined;
};

export const usePhotoUpload = ({ onUploaded, onUploadingChange }: PhotoUploadCallbacks) => {
  const [state, setState] = useState<PhotoUploadState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const upload = async (file: File) => {
    if (file.size > PHOTO_MAX_BYTES) {
      setState({ status: "error", code: "PHOTO_TOO_LARGE" });
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const previewSrc = URL.createObjectURL(file);
    setState({ status: "uploading", progress: 0, previewSrc });
    onUploadingChange?.(true);
    const outcome = await uploadPhoto(
      file,
      (progress) => setState({ status: "uploading", progress, previewSrc }),
      controller.signal,
    );
    URL.revokeObjectURL(previewSrc);
    if (controller.signal.aborted) {
      return;
    }
    onUploadingChange?.(false);
    if (outcome.ok) {
      setState({ status: "idle" });
      onUploaded(outcome.photo.id);
    } else {
      setState({ status: "error", code: errorCodeOf(outcome.body) });
    }
  };

  return { state, upload, reset: () => setState({ status: "idle" }) };
};
