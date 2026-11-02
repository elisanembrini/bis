import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import i18n from "../../../i18n";
import cooking from "../../../i18n/it/cooking.json";
import { useVoicePhrases } from "./useVoicePhrases";

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe("useVoicePhrases", () => {
  it("reads the phrases of every command from the translations", () => {
    const { result } = renderHook(() => useVoicePhrases(), { wrapper });

    expect(result.current).toEqual(cooking.voice.commands);
    expect(result.current.next).toContain("avanti");
    expect(result.current.startTimer).toContain("avvia timer");
  });

  it("provides the language used by speech recognition and synthesis", () => {
    expect(i18n.t("voice.recognitionLang", { ns: "cooking" })).toBe("it-IT");
  });
});
