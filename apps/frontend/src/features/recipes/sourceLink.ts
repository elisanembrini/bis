export const SOURCE_URL_MAX_LENGTH = 2048;

const WEB_ADDRESS_START = /^https?:\/\//i;

export const parseWebAddress = (value: string): URL | null => {
  const trimmed = value.trim();
  if (!WEB_ADDRESS_START.test(trimmed)) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    return url.hostname === "" ? null : url;
  } catch {
    return null;
  }
};

export const isValidSourceUrl = (value: string): boolean =>
  value.trim().length <= SOURCE_URL_MAX_LENGTH && parseWebAddress(value) !== null;

export const sourceHost = (value: string): string | null =>
  parseWebAddress(value)?.hostname.replace(/^www\./i, "") ?? null;
