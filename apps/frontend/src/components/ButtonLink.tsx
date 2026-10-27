import { Button, type ButtonProps } from "@mantine/core";
import { createLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, Ref } from "react";

type MantineButtonAnchorProps = ButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color"> & {
    ref?: Ref<HTMLAnchorElement>;
  };

function MantineButtonAnchor(props: MantineButtonAnchorProps) {
  return <Button component="a" {...props} />;
}

export const ButtonLink = createLink(MantineButtonAnchor);
