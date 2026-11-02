export const SUPPORTED_LANGUAGES = ["it"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "it";

export const LANGUAGE_NAMES: Record<Language, string> = {
  it: "Italiano",
};

export const LANGUAGE_STORAGE_KEY = "bis:language";

export const isLanguage = (value: unknown): value is Language =>
  SUPPORTED_LANGUAGES.some((language) => language === value);
