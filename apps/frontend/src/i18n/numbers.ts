export const decimalSeparator = (language: string): string =>
  new Intl.NumberFormat(language).formatToParts(1.1).find((part) => part.type === "decimal")
    ?.value ?? ".";
