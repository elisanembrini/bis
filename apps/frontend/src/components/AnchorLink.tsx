import { Anchor, type AnchorProps } from "@mantine/core";
import { createLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, Ref } from "react";

type MantineAnchorProps = Omit<AnchorProps, "href"> &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    ref?: Ref<HTMLAnchorElement>;
  };

function MantineAnchor(props: MantineAnchorProps) {
  return <Anchor {...props} />;
}

export const AnchorLink = createLink(MantineAnchor);
