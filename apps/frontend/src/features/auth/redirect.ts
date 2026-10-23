export const sanitizeRedirect = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return undefined;
  }
  return value;
};

export type RedirectSearch = { redirect?: string };

export const validateRedirectSearch = (search: Record<string, unknown>): RedirectSearch => {
  const redirect = sanitizeRedirect(search["redirect"]);
  return redirect === undefined ? {} : { redirect };
};
