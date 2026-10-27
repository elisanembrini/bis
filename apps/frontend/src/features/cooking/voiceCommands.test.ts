import { describe, expect, it } from "vitest";

import { normalizeTranscript, parseCommand } from "./voiceCommands";

describe("parseCommand", () => {
  it.each([
    ["avanti", "next"],
    ["vai avanti", "next"],
    ["prossimo", "next"],
    ["successivo", "next"],
    ["continua", "next"],
    ["indietro", "previous"],
    ["torna indietro", "previous"],
    ["precedente", "previous"],
    ["ripeti", "repeat"],
    ["rileggi", "repeat"],
    ["ancora", "repeat"],
    ["di nuovo", "repeat"],
    ["avvia timer", "startTimer"],
    ["avvia il timer", "startTimer"],
    ["fai partire il timer", "startTimer"],
    ["inizia il timer", "startTimer"],
    ["parti", "startTimer"],
  ])("understands %j", (transcript, command) => {
    expect(parseCommand(transcript)).toBe(command);
  });

  it("ignores case, accents and punctuation", () => {
    expect(parseCommand("AVANTI!")).toBe("next");
    expect(parseCommand("Ripeti, per favore.")).toBe("repeat");
    expect(parseCommand("  Avvìa   il Timer ")).toBe("startTimer");
  });

  it("finds the command inside a longer sentence", () => {
    expect(parseCommand("ok adesso vai avanti grazie")).toBe("next");
  });

  it("uses the last command when there are more", () => {
    expect(parseCommand("avanti no aspetta indietro")).toBe("previous");
    expect(parseCommand("indietro anzi avanti")).toBe("next");
  });

  it("does not react to words that only contain a command", () => {
    expect(parseCommand("partire")).toBeNull();
    expect(parseCommand("ripetizione")).toBeNull();
  });

  it("returns nothing for unrelated speech", () => {
    expect(parseCommand("aggiungi il sale")).toBeNull();
    expect(parseCommand("")).toBeNull();
  });
});

describe("normalizeTranscript", () => {
  it("lowercases and removes accents and punctuation", () => {
    expect(normalizeTranscript("Più SALE, così!")).toBe("piu sale cosi");
  });
});
