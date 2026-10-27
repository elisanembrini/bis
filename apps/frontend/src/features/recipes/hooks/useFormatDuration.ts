import { useTranslation } from "react-i18next";

import { durationParts } from "../duration";

export const useFormatDuration = () => {
  const { t } = useTranslation("recipes");
  return (totalSeconds: number): string => {
    const { hours, minutes, seconds } = durationParts(totalSeconds);
    return [
      hours > 0 ? t("duration.hours", { count: hours }) : null,
      minutes > 0 ? t("duration.minutes", { count: minutes }) : null,
      seconds > 0 ? t("duration.seconds", { count: seconds }) : null,
    ]
      .filter((part) => part !== null)
      .join(" ");
  };
};
