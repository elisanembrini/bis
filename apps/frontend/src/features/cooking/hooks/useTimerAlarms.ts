import { useEffect } from "react";

import { playAlarm } from "../audio";
import { dueTimers } from "../timers";
import { useTimersStore } from "../timersStore";

export const useTimerAlarms = (now: number): void => {
  const timers = useTimersStore((state) => state.timers);
  const finish = useTimersStore((state) => state.finish);

  useEffect(() => {
    const due = dueTimers(Object.values(timers), now);
    if (due.length > 0) {
      finish(due.map((timer) => timer.id));
      playAlarm();
    }
  }, [now, timers, finish]);
};
