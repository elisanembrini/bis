import { Box, type BoxProps } from "@mantine/core";
import type { ReactNode } from "react";

import classes from "./GridPaper.module.css";

type GridPaperProps = BoxProps & {
  children: ReactNode;
};

export function GridPaper({ children, className, ...props }: GridPaperProps) {
  return (
    <Box
      {...props}
      className={className === undefined ? classes.grid : `${classes.grid} ${className}`}
    >
      {children}
    </Box>
  );
}
