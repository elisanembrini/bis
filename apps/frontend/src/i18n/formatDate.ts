import i18n from "./index";

export const formatDate = (
  isoDate: string,
  language: string = i18n.language,
  timeZone?: string,
): string =>
  new Intl.DateTimeFormat(language, {
    dateStyle: "long",
    ...(timeZone === undefined ? {} : { timeZone }),
  }).format(new Date(isoDate));
