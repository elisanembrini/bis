import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";

import i18n from "../../i18n";
import { useTagLabel } from "./useTagLabel";

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const labelOf = (tag: { name: string; key: string | null }) =>
  renderHook(() => useTagLabel(), { wrapper }).result.current(tag);

describe("useTagLabel", () => {
  it("translates the starter tags from their key", () => {
    expect(labelOf({ name: "Antipasti", key: "starters" })).toBe("Antipasti");
    expect(labelOf({ name: "stored name", key: "first_courses" })).toBe("Primi");
    expect(labelOf({ name: "stored name", key: "quick" })).toBe("Veloce");
  });

  it("shows the name of personal tags as written", () => {
    expect(labelOf({ name: "Natale", key: null })).toBe("Natale");
  });

  it("falls back to the stored name for an unknown key", () => {
    expect(labelOf({ name: "Brunch", key: "brunch" })).toBe("Brunch");
  });
});
