import { LANGUAGE_STORAGE_KEY, type Language, isLanguage } from "./languages";

export const readStoredLanguage = (): Language | undefined => {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
};

export const storeLanguage = (language: Language): void => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    return;
  }
};
