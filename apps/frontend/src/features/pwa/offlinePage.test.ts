import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const html = readFileSync(path.join(import.meta.dirname, "../../../public/offline.html"), "utf8");

describe("offline page", () => {
  it("has no script, because the production policy only allows scripts from the site itself", () => {
    expect(html).not.toMatch(/<script/i);
  });

  it("has no inline event handler or javascript link", () => {
    expect(html).not.toMatch(/\son[a-z]+\s*=/i);
    expect(html).not.toMatch(/javascript:/i);
  });

  it("lets the person retry with a plain link", () => {
    expect(html).toMatch(/<a href="">Riprova<\/a>/);
  });
});
