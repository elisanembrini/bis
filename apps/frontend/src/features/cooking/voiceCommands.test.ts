import { describe, expect, it } from "vitest";

import cooking from "../../i18n/it/cooking.json";
import { type VoicePhrases, normalizeTranscript, parseCommand } from "./voiceCommands";

const italian = cooking.voice.commands;

const english: VoicePhrases = {
  next: ["next", "go ahead"],
  previous: ["back", "go back"],
  repeat: ["repeat", "again"],
  startTimer: ["start timer", "start the timer"],
};

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
    expect(parseCommand(transcript, italian)).toBe(command);
  });

  it("ignores case, accents and punctuation", () => {
    expect(parseCommand("AVANTI!", italian)).toBe("next");
    expect(parseCommand("Ripeti, per favore.", italian)).toBe("repeat");
    expect(parseCommand("  Avvìa   il Timer ", italian)).toBe("startTimer");
  });

  it("finds the command inside a longer sentence", () => {
    expect(parseCommand("ok adesso vai avanti grazie", italian)).toBe("next");
  });

  it("uses the last command when there are more", () => {
    expect(parseCommand("avanti no aspetta indietro", italian)).toBe("previous");
    expect(parseCommand("indietro anzi avanti", italian)).toBe("next");
  });

  it("does not react to words that only contain a command", () => {
    expect(parseCommand("partire", italian)).toBeNull();
    expect(parseCommand("ripetizione", italian)).toBeNull();
  });

  it("returns nothing for unrelated speech", () => {
    expect(parseCommand("aggiungi il sale", italian)).toBeNull();
    expect(parseCommand("", italian)).toBeNull();
  });
});

describe("normalizeTranscript", () => {
  it("lowercases and removes accents and punctuation", () => {
    expect(normalizeTranscript("Più SALE, così!")).toBe("piu sale cosi");
  });
});

describe("phrases of another language", () => {
  it("uses the phrases it is given", () => {
    expect(parseCommand("Next!", english)).toBe("next");
    expect(parseCommand("please go back", english)).toBe("previous");
    expect(parseCommand("Start the timer", english)).toBe("startTimer");
  });

  it("does not understand the phrases of a different language", () => {
    expect(parseCommand("avanti", english)).toBeNull();
    expect(parseCommand("next", italian)).toBeNull();
  });

  it("ignores empty phrases", () => {
    expect(parseCommand("avanti", { ...italian, next: ["", "   "] })).toBeNull();
  });
});
