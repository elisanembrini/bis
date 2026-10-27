import { Alert } from "@mantine/core";
import type { ReactNode } from "react";

import { ErrorIcon, InfoIcon, SuccessIcon } from "./icons";

type MessageProps = {
  title: string;
  children?: ReactNode;
};

export function ErrorMessage({ title, children }: MessageProps) {
  return (
    <Alert color="pomodoro.8" icon={<ErrorIcon />} title={title} role="alert">
      {children}
    </Alert>
  );
}

export function SuccessMessage({ title, children }: MessageProps) {
  return (
    <Alert color="green.8" icon={<SuccessIcon />} title={title} role="alert">
      {children}
    </Alert>
  );
}

export function InfoMessage({ title, children }: MessageProps) {
  return (
    <Alert color="inchiostro" icon={<InfoIcon />} title={title} role="alert">
      {children}
    </Alert>
  );
}
