import { Title, type TitleOrder } from "@mantine/core";
import type { ReactNode } from "react";

import classes from "./HandwrittenTitle.module.css";

type HandwrittenTitleProps = {
  children: ReactNode;
  order?: TitleOrder;
  size?: number;
};

export function HandwrittenTitle({ children, order = 1, size = 32 }: HandwrittenTitleProps) {
  return (
    <Title order={order} fz={size} className={classes.title}>
      {children}
    </Title>
  );
}
