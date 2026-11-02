import i18n from "./index";

export const formatList = (items: readonly string[], language: string = i18n.language): string =>
  new Intl.ListFormat(language, { style: "long", type: "conjunction" }).format(items);
