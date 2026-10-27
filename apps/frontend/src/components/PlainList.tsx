import type { ReactNode } from "react";

import classes from "./PlainList.module.css";

type PlainListProps = {
  label: string;
  children: ReactNode;
};

export function PlainList({ label, children }: PlainListProps) {
  return (
    <ul className={classes.list} aria-label={label}>
      {children}
    </ul>
  );
}
