import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import { defaultNamespace, resources } from "./resources";

const i18n = createInstance({
  lng: "it",
  fallbackLng: "it",
  supportedLngs: ["it"],
  defaultNS: defaultNamespace,
  resources,
  initAsync: false,
  interpolation: { escapeValue: false },
});

void i18n.use(initReactI18next).init();

export default i18n;
