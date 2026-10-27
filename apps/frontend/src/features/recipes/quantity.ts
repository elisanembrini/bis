const QUANTITY_PATTERN = /^(\d{1,7})(?:[.,](\d{1,3}))?$/;

export type ParsedQuantity = { ok: true; value: string | null } | { ok: false };

export const parseQuantity = (input: string): ParsedQuantity => {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { ok: true, value: null };
  }
  const match = QUANTITY_PATTERN.exec(trimmed);
  if (match === null) {
    return { ok: false };
  }
  const [, integerPart = "", decimalPart] = match;
  const value = decimalPart === undefined ? integerPart : `${integerPart}.${decimalPart}`;
  if (Number(value) <= 0) {
    return { ok: false };
  }
  return { ok: true, value: normalize(value) };
};

const normalize = (value: string): string => {
  const [integerPart = "0", decimalPart = ""] = value.split(".");
  const integer = integerPart.replace(/^0+(?=\d)/, "");
  const decimals = decimalPart.replace(/0+$/, "");
  return decimals === "" ? integer : `${integer}.${decimals}`;
};

export const formatQuantity = (value: string): string => normalize(value).replace(".", ",");

export const quantityToInput = (value: string | null): string =>
  value === null ? "" : formatQuantity(value);
