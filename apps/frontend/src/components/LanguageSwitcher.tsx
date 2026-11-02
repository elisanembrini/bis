import { useTranslation } from "react-i18next";

import { selectLanguage } from "../i18n";
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, isLanguage } from "../i18n/languages";
import { LanguageSelect } from "./LanguageSelect";

const LANGUAGE_OPTIONS = SUPPORTED_LANGUAGES.map((code) => ({
  code,
  name: LANGUAGE_NAMES[code],
}));

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <LanguageSelect
      languages={LANGUAGE_OPTIONS}
      value={i18n.language}
      onChange={(code) => {
        if (isLanguage(code)) {
          void selectLanguage(code);
        }
      }}
    />
  );
}
