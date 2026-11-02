import { describe, expect, it } from "vitest";

import { formatList } from "./formatList";

describe("formatList", () => {
  it("joins names the way the language does", () => {
    expect(formatList(["Bruno", "Carla"], "it")).toBe("Bruno e Carla");
    expect(formatList(["Bruno", "Carla"], "en")).toBe("Bruno and Carla");
    expect(formatList(["Anna", "Bruno", "Carla"], "it")).toBe("Anna, Bruno e Carla");
  });

  it("follows the active language by default", () => {
    expect(formatList(["Bruno", "Carla"])).toBe("Bruno e Carla");
  });
});
