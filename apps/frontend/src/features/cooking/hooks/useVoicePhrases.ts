import { useTranslation } from "react-i18next";

import type { VoicePhrases } from "../voiceCommands";

const asStrings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const useVoicePhrases = (): VoicePhrases => {
  const { t } = useTranslation("cooking");

  return {
    next: asStrings(t("voice.commands.next", { returnObjects: true })),
    previous: asStrings(t("voice.commands.previous", { returnObjects: true })),
    repeat: asStrings(t("voice.commands.repeat", { returnObjects: true })),
    startTimer: asStrings(t("voice.commands.startTimer", { returnObjects: true })),
  };
};
