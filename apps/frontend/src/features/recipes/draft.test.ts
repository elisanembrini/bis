import { afterEach, describe, expect, it } from "vitest";

import { draftKey, readDraft, removeDraft, removeDraftsOf, writeDraft } from "./draft";
import { emptyRecipeForm } from "./form";

const values = emptyRecipeForm(() => "k");

afterEach(() => {
  window.localStorage.clear();
});

describe("recipe drafts", () => {
  it("keeps drafts per user and per recipe", () => {
    writeDraft(draftKey("u1", undefined), { savedAt: "2026-01-01T10:00:00Z", values });

    expect(readDraft(draftKey("u1", undefined))?.savedAt).toBe("2026-01-01T10:00:00Z");
    expect(readDraft(draftKey("u2", undefined))).toBeUndefined();
    expect(readDraft(draftKey("u1", "r1"))).toBeUndefined();
  });

  it("is removed after saving", () => {
    const key = draftKey("u1", "r1");
    writeDraft(key, { savedAt: "2026-01-01T10:00:00Z", values });

    removeDraft(key);

    expect(readDraft(key)).toBeUndefined();
  });

  it("removes all drafts of a user at logout and keeps the others", () => {
    writeDraft(draftKey("u1", undefined), { savedAt: "x", values });
    writeDraft(draftKey("u1", "r1"), { savedAt: "x", values });
    writeDraft(draftKey("u2", "r2"), { savedAt: "x", values });

    removeDraftsOf("u1");

    expect(readDraft(draftKey("u1", undefined))).toBeUndefined();
    expect(readDraft(draftKey("u1", "r1"))).toBeUndefined();
    expect(readDraft(draftKey("u2", "r2"))).toBeDefined();
  });

  it("ignores corrupted entries", () => {
    window.localStorage.setItem(draftKey("u1", undefined), "{not json");

    expect(readDraft(draftKey("u1", undefined))).toBeUndefined();
  });
});
