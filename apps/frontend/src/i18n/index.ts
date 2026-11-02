import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE, type Language, SUPPORTED_LANGUAGES } from "./languages";
import { defaultNamespace, resources } from "./resources";
import { readStoredLanguage, storeLanguage } from "./storage";

const i18n = createInstance({
  lng: readStoredLanguage() ?? DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  defaultNS: defaultNamespace,
  resources,
  initAsync: false,
  interpolation: { escapeValue: false },
});

void i18n.use(initReactI18next).init();

const setDocumentLanguage = (language: string) => {
  document.documentElement.lang = language;
};

setDocumentLanguage(i18n.language);
i18n.on("languageChanged", setDocumentLanguage);

export const selectLanguage = async (language: Language): Promise<void> => {
  storeLanguage(language);
  await i18n.changeLanguage(language);
};

export default i18n;
